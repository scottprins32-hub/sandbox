# SSK Bag Configurator

A visual configurator for SSK PROEDGE custom baseball bags, built for SSK Europe.

## Why this exists

SSK Europe sells custom bags where the customer picks a base model, a material, and a
colour for each individual part of the bag. Today that sale happens over WhatsApp: the
seller sends a PDF and photos and explains the options in prose. Customers can't picture
the result and don't understand what "part C" means. Orders get transcribed by hand.

This tool replaces that with a live visual configurator, and — critically — emits the
exact order row that SSK Europe types into its Excel sheet before mailing SSK Japan.

**The order-string output is the point, not a nice-to-have.** It removes manual data entry
and transcription errors from the seller's workflow. That is what earns buy-in.

## Who it's for

- **Primary demo audience:** Pim (owner, SSK Europe). Approval gate for everything else.
- **End users:** club players and team managers, mostly on mobile, in NL/IT/ES/EN.

## Ground truth

`data/ssk-bags.json` is the single source of truth. 16 custom models, 35 stock models,
palettes, part charts, per-model exceptions, stock/custom price deltas, order-string format.

**Never hardcode a price, colour, dimension or rule in a component.** Everything renders
from that file. When SSK reprices (they do, annually — the catalogue shows 新価格 stickers
on many items), we edit one file.

## Non-obvious domain rules — read before touching colour logic

1. **Part letters differ between charts.** On the backpack chart `E` = piping and `F` =
   zipper. On the shoulder chart `F` = piping and `H` = zipper. Do not share letter logic
   across charts. This is the single easiest way to ship a wrong order.
2. **Zippers are always black.** Render them, never offer a choice.
3. **Piping is always enamel material**, even on a leather or fibre bag. It's the only part
   that can be yellow, orange or gold — it's where club identity lives.
4. **Material does not change price.** `PEO-44BE`, `-44BS` and `-44BP` are all €129.95.
5. **Switching material can invalidate chosen colours.** Leather has only 5 colours; enamel
   has 9. Re-validate every part on material change and tell the user what changed rather
   than silently resetting.
6. **Backpack part D is always carbon-look leather** and limited to 6 colours regardless of
   the bag's material.
7. **Tote models (53B/54B/55B) have no piping at all.**
8. **PEO-56B belt is black only.** PEO-46B and PEO-56B carry no PROEDGE mark.
9. **Bat cases take no patch.**

## Assets

`assets/page2-full.svg` — extracted from SSK Europe's own CorelDRAW artwork. Page 2 of the
custom-bags PDF is **pure vector**: 4,233 path objects, zero raster images. Seven models
have real vector art: 52B, 50B, 45B, 44B, 39C/40C, 37C, 38C.

The remaining nine models have no vector source yet — only raster scans of Japanese line
diagrams. Do not fake them. Either get the `.cdr` source from Pim (paths are likely already
grouped per part, which would make part-mapping nearly free) or leave those models
photo-only until assets exist.

## Scope discipline

Build **two models deep, not sixteen shallow**: `PEO-50B` (backpack) and `PEO-44B` (duffle).
Two different part charts, two different form factors — proves the system generalises.
Everything else waits for Pim's yes.

## Shared code

The `PartColorizer` layer is shared with the existing glove configurator. Build the colour
engine once with a product-schema interface; bags and gloves are two schemas over one engine.

## Deploy target

Self-contained static bundle, embeddable via iframe. We don't control Pim's website stack
and shouldn't assume one. Mobile-first — he will open it on his phone.

## Explicitly out of scope for now

Checkout, payment, stock levels, account systems, and final embroidery pricing. Pricing
questions are deferred until after Pim approves the build.
