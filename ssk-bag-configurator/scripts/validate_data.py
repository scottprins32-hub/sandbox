#!/usr/bin/env python3
"""Integrity check for data/ssk-bags.json.

ssk-bags.json is the single source of truth: every price, colour, dimension and
rule in the configurator renders from it. SSK reprices annually, so that file
gets hand-edited. This script is the guard rail on those edits.

Stdlib only, no dependencies.

    python3 scripts/validate_data.py [path/to/ssk-bags.json]

Exit code 0 if there are no ERRORs (WARNs are allowed), 1 otherwise.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ERRORS: list[str] = []
WARNINGS: list[str] = []
NOTES: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def note(msg: str) -> None:
    NOTES.append(msg)


# Rules that live only as English prose in a model's `exceptions` list but that
# actually change colour logic. A component cannot enforce these without either
# hardcoding them or parsing English -- both of which CLAUDE.md forbids.
PROSE_RULE_PATTERNS = [
    (r"BLACK ONLY", "forces a part to a fixed colour"),
    (r"carbon-look", "overrides a part's material and palette"),
    (r"No piping", "removes a part from the chart"),
    (r"same colour as", "slaves one part's colour to another"),
]


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"FATAL: {path} not found", file=sys.stderr)
        raise SystemExit(2)
    except json.JSONDecodeError as exc:
        print(f"FATAL: {path} is not valid JSON: {exc}", file=sys.stderr)
        raise SystemExit(2)


def check_palettes(d: dict) -> None:
    colors = d["colors"]
    for code, c in colors.items():
        if c.get("code") != code:
            err(f"colors['{code}'].code is '{c.get('code')}' -- key and code disagree")
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", c.get("hex", "")):
            err(f"colors['{code}'].hex '{c.get('hex')}' is not a 6-digit hex value")

    for name, pal in d["palettes"].items():
        if not pal["colors"]:
            err(f"palette '{name}' is empty")
        for code in pal["colors"]:
            if code not in colors:
                err(f"palette '{name}' references unknown colour '{code}'")
        if len(set(pal["colors"])) != len(pal["colors"]):
            err(f"palette '{name}' contains duplicate colour codes")

    for code, m in d["materials"].items():
        if m["palette"] not in d["palettes"]:
            err(f"material '{code}' references unknown palette '{m['palette']}'")


def check_charts(d: dict) -> None:
    palettes = d["palettes"]
    for name, chart in d["part_charts"].items():
        seen: set[str] = set()
        for part in chart["parts"]:
            pid = part["id"]
            if pid in seen:
                err(f"chart '{name}' defines part '{pid}' twice")
            seen.add(pid)
            pal = part["palette"]
            if pal != "material" and pal not in palettes:
                err(f"chart '{name}' part '{pid}' references unknown palette '{pal}'")
            if part.get("locked") and pal != "material" and len(palettes[pal]["colors"]) != 1:
                err(
                    f"chart '{name}' part '{pid}' is locked but its palette "
                    f"'{pal}' offers {len(palettes[pal]['colors'])} colours"
                )


def check_models(d: dict) -> None:
    charts = d["part_charts"]
    materials = d["materials"]
    codes: set[str] = set()

    for m in d["models"]:
        code = m["code"]
        if code in codes:
            err(f"model '{code}' is defined twice")
        codes.add(code)

        chart_name = m["chart"]
        if chart_name not in charts:
            err(f"model '{code}' references unknown chart '{chart_name}'")
            continue
        chart = charts[chart_name]

        # The chart's own applies_to list must agree with the model's chart field.
        if code not in chart["applies_to"]:
            err(
                f"model '{code}' claims chart '{chart_name}' but that chart's "
                f"applies_to does not list it"
            )

        chart_ids = [p["id"] for p in chart["parts"]]
        for pid in m["parts"]:
            if pid not in chart_ids:
                err(f"model '{code}' lists part '{pid}', absent from chart '{chart_name}'")

        # Parts must be listed in the chart's own letter order -- the order string
        # depends on it.
        ordered = [p for p in chart_ids if p in m["parts"]]
        if ordered != list(m["parts"]):
            err(
                f"model '{code}' parts {m['parts']} are not in chart order "
                f"(expected {ordered}) -- the order string would come out wrong"
            )

        for mat in m["materials"]:
            if mat not in materials:
                err(f"model '{code}' offers unknown material '{mat}'")

        check_stock_twin(m)
        check_sample_colourway(d, m, chart)
        check_prose_rules(m)

    # applies_to must not name models that do not exist.
    for name, chart in charts.items():
        for code in chart["applies_to"]:
            if code not in codes:
                err(f"chart '{name}'.applies_to names unknown model '{code}'")


def check_stock_twin(m: dict) -> None:
    st = m.get("stock_twin")
    if not st:
        return
    calc = round(m["price_eur"] - st["price_eur"], 2)
    if abs(calc - st["delta_eur"]) >= 0.005:
        err(
            f"model '{m['code']}' stock_twin delta_eur is {st['delta_eur']:.2f} but "
            f"{m['price_eur']:.2f} - {st['price_eur']:.2f} = {calc:.2f}"
        )


def check_sample_colourway(d: dict, m: dict, chart: dict) -> None:
    sample = m.get("catalogue_sample_colourway")
    if not sample:
        return
    palettes = d["palettes"]
    materials = d["materials"]
    by_id = {p["id"]: p for p in chart["parts"]}

    for pid, code in sample.items():
        part = by_id.get(pid)
        if part is None:
            err(f"model '{m['code']}' sample colourway names part '{pid}', not in its chart")
            continue
        if code not in d["colors"]:
            err(f"model '{m['code']}' sample colourway part '{pid}' uses unknown colour '{code}'")
            continue
        if part["palette"] == "material":
            unavailable = [
                mat
                for mat in m["materials"]
                if code not in palettes[materials[mat]["palette"]]["colors"]
            ]
            if unavailable:
                warn(
                    f"model '{m['code']}' sample colourway {pid}={code} "
                    f"({d['colors'][code]['name_en']}) is unavailable in material(s) "
                    f"{unavailable} -- the catalogue sample cannot be built in those"
                )
        elif code not in palettes[part["palette"]]["colors"]:
            err(
                f"model '{m['code']}' sample colourway {pid}={code} is not in "
                f"palette '{part['palette']}'"
            )

    colourable = [p for p in m["parts"] if not by_id[p].get("locked")]
    missing = [p for p in colourable if p not in sample]
    if missing:
        warn(f"model '{m['code']}' sample colourway omits colourable part(s) {missing}")


def check_prose_rules(m: dict) -> None:
    for exc in m.get("exceptions", []):
        for pattern, effect in PROSE_RULE_PATTERNS:
            if re.search(pattern, exc):
                note(f"{m['code']}: prose-only rule {effect} -- \"{exc}\"")
                break


def check_vector_art(d: dict) -> None:
    with_art = [m["code"] for m in d["models"] if m.get("vector_art") == "page2"]
    note(
        f"{len(with_art)} models carry vector_art='page2': {', '.join(with_art)}. "
        "CLAUDE.md and the kickoff both describe SEVEN illustrations on that page -- "
        "PEO-39C and PEO-40C are the two bat-case sizes and share one drawing. "
        "regions.json must therefore map 7 regions onto 8 models."
    )


def check_order_string(d: dict) -> None:
    """The order string is the product. Validate the documented example against
    the charts so a bad edit to either surfaces here."""
    spec = d["order_string"]
    example = spec["example"]
    head = example.split("|")[0].strip()
    mm = re.fullmatch(r"(PEO-\d+[BC])([ESP])", head)
    if not mm:
        err(f"order_string.example head '{head}' is not {{MODEL}}{{MATERIAL}}")
        return
    model_code, material = mm.group(1), mm.group(2)

    model = next((m for m in d["models"] if m["code"] == model_code), None)
    if model is None:
        err(f"order_string.example references unknown model '{model_code}'")
        return
    if material not in model["materials"]:
        err(f"order_string.example uses material '{material}', not offered by {model_code}")

    pairs = re.findall(r"([A-Z]+):(\d+)", example)
    listed = [p for p, _ in pairs]
    if listed != list(model["parts"]):
        err(
            f"order_string.example lists parts {listed} but {model_code} has "
            f"{model['parts']} -- example and data disagree"
        )

    chart = d["part_charts"][model["chart"]]
    by_id = {p["id"]: p for p in chart["parts"]}
    palettes, materials = d["palettes"], d["materials"]
    for pid, code in pairs:
        part = by_id.get(pid)
        if part is None:
            continue
        pal = (
            materials[material]["palette"]
            if part["palette"] == "material"
            else part["palette"]
        )
        if code not in palettes[pal]["colors"]:
            err(
                f"order_string.example {pid}:{code} is not in palette '{pal}' "
                f"for material {material}"
            )


def check_open_questions(d: dict) -> None:
    if not d["embroidery"].get("confirmed", False):
        note(
            "embroidery.confirmed is false -- add-on prices are unconfirmed with "
            "SSK Europe and must be labelled provisional wherever they are shown."
        )
    for rule in d["order_string"]["rules"]:
        if "confirm which" in rule:
            note(f"order_string open question: \"{rule}\"")
    for todo in d["meta"].get("TODO", []):
        note(f"meta TODO: {todo}")


def main() -> int:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else (
        Path(__file__).resolve().parent.parent / "data" / "ssk-bags.json"
    )
    d = load(path)

    check_palettes(d)
    check_charts(d)
    check_models(d)
    check_vector_art(d)
    check_order_string(d)
    check_open_questions(d)

    print(f"Validated {path}")
    print(f"  {len(d['models'])} custom models, {len(d['stock_bags'])} stock models, "
          f"{len(d['colors'])} colours, {len(d['palettes'])} palettes, "
          f"{len(d['part_charts'])} part charts")
    print()

    for label, items in (("ERROR", ERRORS), ("WARN", WARNINGS), ("NOTE", NOTES)):
        for item in items:
            print(f"{label}: {item}")
        if items:
            print()

    print(f"{len(ERRORS)} error(s), {len(WARNINGS)} warning(s), {len(NOTES)} note(s)")
    return 1 if ERRORS else 0


if __name__ == "__main__":
    raise SystemExit(main())
