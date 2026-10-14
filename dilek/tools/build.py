#!/usr/bin/env python3
"""Build the static Dilek Chicken site.

    python3 dilek/tools/build.py

Reads the page bodies in dilek/src/*.html, wraps them in the shared head,
header, footer and mobile bar, expands the {{tokens}} below and writes plain
HTML next to the assets (dilek/index.html, dilek/menu/index.html, ...).
Prices, opening hours and addresses live only in this file.

Tokens:
  {{root}}                     relative path to the site root ("./" or "../")
  {{pic slug | alt | attrs}}   responsive <picture> (AVIF + WebP) from src/images.json
  {{locations}}                the three location cards
  {{menu}} {{menu_nav}}        the full menu and its category chips
  {{packages}} {{package_options}}  catering cards and the form's package choices
  {{email}} {{mailto_jobs}}    contact address and the job-application mailto
"""
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

SITE = Path(__file__).resolve().parent.parent
SRC = SITE / "src"
DOMAIN = "https://dilek-chicken.nl/"
VERSION = "1"  # bump when site.css / site.js change, to bust caches

EMAIL = "info@dilek-chicken.nl"
SOCIAL = [
    ("Instagram", "https://www.instagram.com/dilekchicken"),
    ("TikTok", "https://www.tiktok.com/@dilekchicken"),
    ("Facebook", "https://www.facebook.com/dilekchicken"),
]

LOCATIONS = [
    dict(id="osdorp", name="Osdorp", street="Osdorper Ban 156", postcode="1069 BC", city="Amsterdam",
         phone="0646465044", opens="10:30", closes="20:00", lat=52.3591370, lng=4.7842675, img="loc-osdorp",
         alt="De Dilek Chicken-zaak aan de Osdorper Ban, met zwarte parasols, terras en het kippenbeeld bij de ingang"),
    dict(id="westpoort", name="Westpoort", street="Sierenborch 11", postcode="1046 BB", city="Amsterdam",
         phone="0658909294", opens="10:00", closes="19:00", lat=52.3901460, lng=4.8046349, img="loc-westpoort",
         alt="De glazen pui van Dilek Chicken Westpoort, met het logo op de ramen"),
    dict(id="haarlem", name="Haarlem", street="Van Zeggelenplein 131", postcode="2032 KE", city="Haarlem",
         phone="0658909294", opens="10:30", closes="19:00", lat=52.3788241, lng=4.6596036, img="loc-haarlem",
         alt="De Dilek Chicken-kraam op het Van Zeggelenplein in Haarlem, met klanten aan de toonbank"),
]

GRILLWORST = "Smaken: naturel, kaas of madame jeanette."
HOTDOG = "Smaken: naturel, pittig of mix."
MENU = [
    dict(id="kip", title="Hele kip & kippenbouten", intro="Gegrild aan het spit, met onze eigen kruidenmix.",
         imgs=[("cut-hele-kip", "Twee goudbruin gegrilde hele kippen op een zwarte schaal"),
               ("cut-kippenbouten", "Gegrilde kippenbouten op een zwarte schaal")],
         groups=[dict(note="Vers van het spit.", items=[
             dict(n="Hele kip", p="11,99"),
             dict(n="Kippenbouten", q="1 kg", p="14,99"),
         ])]),
    dict(id="borrel", title="Borrelhapjes & vleugels", intro="Krokant, kleverig en perfect om te delen.",
         imgs=[("cut-borrelhapjes", "Een schaal krokante kippenvleugels en borrelhapjes")],
         groups=[dict(note="Krokante kippenvleugels en hapjes.", items=[
             dict(n="Borrelhapjes", q="500 g", p="7,99"),
             dict(n="Borrelhapjes", q="1 kg", p="14,99"),
         ])]),
    dict(id="worst", title="Grillworst & hotdogs", intro="Per stuk, per zak of in een vers broodje.",
         imgs=[("cut-grillworst", "Een stapel grillworsten, een paar in plakken gesneden"),
               ("cut-hotdog-pittig", "Een broodje hotdog op een zwarte schaal")],
         groups=[
             dict(label="Grillworst", note=GRILLWORST, items=[
                 dict(n="Grillworst", q="1 stuk", p="5,49"),
                 dict(n="Grillworst", q="2 stuks", p="9,99"),
                 dict(n="Grillworst", q="7 stuks", p="31,49"),
                 dict(n="Broodje of bakje grillworst", p="6,99"),
             ]),
             dict(label="Hotdogs", note=HOTDOG, items=[
                 dict(n="Hotdog", q="1 stuk", p="3,49"),
                 dict(n="Hotdog", q="5 stuks", p="15,49"),
                 dict(n="Broodje hotdog", p="6,99", badge="#1 bestseller"),
             ]),
         ]),
    dict(id="kipvingers", title="Kipvingers", intro="Goudbruin, krokant en altijd vers uit de pan.",
         imgs=[("cut-kipvingers", "Een schaal kipvingers met drie sausjes")],
         groups=[dict(note="Krokante kipvingers.", items=[
             dict(n="Broodje of bakje kipvingers", p="6,99"),
             dict(n="Kipvingers", q="500 g", p="12,99"),
             dict(n="Kipvingers", q="1 kg", p="24,99"),
         ])]),
    dict(id="salon", title="Kipsalon & krieltjes", intro="Voor als je honger serieus is.",
         imgs=[("cut-krieltjes", "Een bakje geroosterde krieltjes met mayonaise")],
         groups=[
             dict(items=[dict(n="Kipsalon", p="10,99", d="Met toppings als sla, tomaat, komkommer en kaas.")]),
             dict(label="Krieltjes", note="Geroosterde krieltjes.", items=[
                 dict(n="Krieltjes", q="bakje", p="4,49"),
                 dict(n="Krieltjes", q="500 g", p="7,99"),
                 dict(n="Krieltjes", q="1 kg", p="13,99"),
             ]),
         ]),
]

PACKAGES = [
    dict(id="klein", name="Klein pakket", people="10–15 personen", price="199,99",
         items=["10 kippenbouten", "3 kg borrelhapjes en vleugels", "3 kg kipvingers", "3 kg krieltjes", "Diverse sauzen"]),
    dict(id="medium", name="Medium pakket", people="20–30 personen", price="399,99",
         items=["5 hele kippen", "20 kippenbouten", "5 kg borrelhapjes en vleugels", "5 kg kipvingers", "5 kg krieltjes",
                "Diverse sauzen"]),
    dict(id="groot", name="Groot pakket", people="40–50 personen", price="699,99",
         items=["10 hele kippen", "40 kippenbouten", "8 kg borrelhapjes en vleugels", "8 kg kipvingers", "8 kg krieltjes",
                "Diverse sauzen"]),
    dict(id="maat", name="Op maat", people="Jij kiest", price=None,
         items=["Gevulde broodjes naar keuze", "Kies je eigen gerechten", "Bepaal de hoeveelheden",
                "Speciale wensen mogelijk", "Persoonlijk advies"]),
]

NAV = [("menu", "Menu", "menu/"), ("catering", "Catering", "catering/"),
       ("vacatures", "Vacatures", "vacatures/"), ("contact", "Contact", "contact/")]

PAGES = [
    dict(src="home.html", out="index.html", path="", nav="home",
         title="Dilek Chicken · Kip eten doe je bij Dilek",
         description="Elke dag vers gegrilde kip, kippenbouten, kipvingers en grillworst. 100% halal. "
                     "In Amsterdam Osdorp, Westpoort en Haarlem.",
         preload="kip-grillen", ld="org"),
    dict(src="menu.html", out="menu/index.html", path="menu/", nav="menu",
         title="Menu · Dilek Chicken",
         description="Het hele menu van Dilek Chicken met prijzen: hele kip, kippenbouten, borrelhapjes, "
                     "grillworst, hotdogs, kipvingers, kipsalon en krieltjes.",
         ld="menu"),
    dict(src="catering.html", out="catering/index.html", path="catering/", nav="catering",
         title="Catering · Dilek Chicken",
         description="Gegrilde kip voor je feest of evenement. Pakketten voor 10 tot 50 personen vanaf € 199,99, "
                     "gratis bezorgd. Bestel minimaal 24 uur van tevoren."),
    dict(src="vacatures.html", out="vacatures/index.html", path="vacatures/", nav="vacatures",
         title="Vacatures · Werken bij Dilek Chicken",
         description="Werk mee aan de lekkerste gegrilde kip van de stad. We zoeken medewerkers bediening "
                     "en een kok / grillmeester."),
    dict(src="contact.html", out="contact/index.html", path="contact/", nav="contact",
         title="Contact & locaties · Dilek Chicken",
         description="Adressen, openingstijden en telefoonnummers van Dilek Chicken in Osdorp, Westpoort en Haarlem.",
         ld="org"),
    dict(src="privacy.html", out="privacy/index.html", path="privacy/", nav="privacy",
         title="Privacy · Dilek Chicken", description="Privacyverklaring van Dilek Chicken.", robots="noindex"),
]

IMAGES = json.loads((SRC / "images.json").read_text(encoding="utf-8"))


def esc(s):
    return html.escape(s, quote=True)


def tel(n):
    return "tel:+31" + n[1:]


def phone_fmt(n):
    return f"{n[:2]} {n[2:4]} {n[4:6]} {n[6:8]} {n[8:]}"


def route_url(loc):
    q = f"Dilek Chicken, {loc['street']}, {loc['postcode']} {loc['city']}"
    return "https://www.google.com/maps/dir/?api=1&destination=" + quote(q)


def pic(slug, alt, attrs, root):
    sizes = []
    for w, h in IMAGES[slug]:
        if [w, h] not in sizes:
            sizes.append([w, h])
    m = re.search(r'sizes="([^"]*)"', attrs)
    sz = m.group(1) if m else "100vw"
    attrs = re.sub(r'\s*sizes="[^"]*"', "", attrs).strip()
    if "loading=" not in attrs:
        attrs = ('loading="lazy" ' + attrs).strip()

    def srcset(ext):
        return ", ".join(f"{root}assets/img/{slug}-{w}.{ext} {w}w" for w, _ in sizes)

    w0, h0 = sizes[0]
    return (f'<picture><source type="image/avif" srcset="{srcset("avif")}" sizes="{sz}">'
            f'<source type="image/webp" srcset="{srcset("webp")}" sizes="{sz}">'
            f'<img src="{root}assets/img/{slug}-{w0}.webp" width="{w0}" height="{h0}" alt="{esc(alt)}" '
            f'decoding="async" {attrs}></picture>')


def locations_html(root):
    out = ['<div class="locs" data-locs>']
    for loc in LOCATIONS:
        out.append(f'''<article class="loc" id="loc-{loc['id']}" data-loc data-name="{loc['name']}" data-open="{loc['opens']}" data-close="{loc['closes']}" data-lat="{loc['lat']}" data-lng="{loc['lng']}">
  <div class="loc-media">{{{{pic {loc['img']} | {loc['alt']} | sizes="(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw"}}}}
    <p class="loc-status" data-status hidden></p>
  </div>
  <div class="loc-body">
    <div class="loc-title"><h3 class="loc-name">{loc['name']}</h3><p class="loc-dist" data-dist hidden></p></div>
    <address class="loc-addr">{loc['street']}<br>{loc['postcode']} {loc['city']}</address>
    <dl class="loc-hours"><dt>Maandag t/m zondag</dt><dd>{loc['opens']} – {loc['closes']}</dd></dl>
    <div class="loc-actions">
      <a class="btn btn-red" href="{esc(route_url(loc))}" target="_blank" rel="noopener">Route<span class="sr-only"> naar Dilek Chicken {loc['name']} (opent Google Maps)</span></a>
      <a class="btn btn-line" href="{tel(loc['phone'])}"><span class="sr-only">Bel {loc['name']}: </span>{phone_fmt(loc['phone'])}</a>
    </div>
  </div>
</article>''')
    out.append("</div>")
    return "\n".join(out)


def menu_nav_html():
    chips = "".join(f'<li><a href="#{c["id"]}">{c["title"]}</a></li>' for c in MENU)
    return f'<nav class="menu-nav" aria-label="Menucategorieën"><ul>{chips}</ul></nav>'


def item_html(it):
    q = f' <span class="mi-q">{it["q"]}</span>' if it.get("q") else ""
    badge = f' <span class="badge">{it["badge"]}</span>' if it.get("badge") else ""
    desc = f'<span class="mi-desc">{it["d"]}</span>' if it.get("d") else ""
    return (f'<li class="mi"><span class="mi-name">{it["n"]}{q}{badge}</span><span class="mi-lead" aria-hidden="true"></span>'
            f'<span class="mi-price">€&nbsp;{it["p"]}</span>{desc}</li>')


def menu_html():
    out = []
    for i, c in enumerate(MENU, 1):
        imgs = "".join(
            f'<div class="menu-cut">{{{{pic {s} | {a} | sizes="(min-width: 900px) 30vw, 80vw"}}}}</div>' for s, a in c["imgs"])
        groups = []
        for g in c["groups"]:
            label = f'<h3 class="menu-group-label">{g["label"]}</h3>' if g.get("label") else ""
            note = f'<p class="menu-group-note">{g["note"]}</p>' if g.get("note") else ""
            items = "".join(item_html(it) for it in g["items"])
            groups.append(f'<div class="menu-group">{label}{note}<ul class="menu-list">{items}</ul></div>')
        out.append(f'''<section class="menu-cat" id="{c['id']}" aria-labelledby="{c['id']}-t">
  <div class="menu-cat-head">
    <p class="eyebrow">{i:02d} / {len(MENU):02d}</p>
    <h2 class="h2" id="{c['id']}-t">{c['title']}</h2>
    <p class="menu-cat-intro">{c['intro']}</p>
    <div class="menu-cuts">{imgs}</div>
  </div>
  <div class="menu-cat-body">{''.join(groups)}</div>
</section>''')
    return "\n".join(out)


def packages_html():
    out = ['<div class="packages">']
    for p in PACKAGES:
        price = (f'<p class="pkg-price"><span class="pkg-cur">€</span>{p["price"]}</p>' if p["price"]
                 else '<p class="pkg-price pkg-price-text">Prijs op maat</p>')
        lis = "".join(f"<li>{x}</li>" for x in p["items"])
        out.append(f'''<article class="pkg">
  <header class="pkg-head"><p class="eyebrow">{'Pakket' if p['price'] else 'Pakket naar wens'}</p><h3 class="pkg-name">{p['name'].replace(' pakket', '')}</h3><p class="pkg-people">{p['people']}</p></header>
  {price}
  <ul class="pkg-list">{lis}</ul>
  <a class="btn btn-ink pkg-pick" href="#aanvraag" data-pick="{p['id']}">Kies {p['name'].replace(' pakket', '').lower() if p['price'] else 'op maat'}</a>
</article>''')
    out.append("</div>")
    return "\n".join(out)


def package_options_html():
    out = []
    for p in PACKAGES:
        price = f"€ {p['price']}" if p["price"] else "Prijs op maat"
        out.append(f'''<label class="choice"><input type="radio" name="pakket" value="{p['id']}" data-name="{p['name']}" data-people="{p['people']}" data-price="{p['price'] or ''}" data-items="{esc('|'.join(p['items']))}" required>
  <span class="choice-body"><span class="choice-name">{p['name']}</span><span class="choice-meta">{p['people']} · {price}</span></span></label>''')
    return "\n".join(out)


def org_ld():
    url = DOMAIN
    graph = [{
        "@type": "Organization", "@id": url + "#org", "name": "Dilek Chicken", "url": url,
        "logo": url + "assets/img/logo-971.png", "email": EMAIL, "sameAs": [u for _, u in SOCIAL],
    }]
    for loc in LOCATIONS:
        graph.append({
            "@type": "Restaurant", "@id": url + "#" + loc["id"], "name": f"Dilek Chicken {loc['name']}",
            "parentOrganization": {"@id": url + "#org"}, "url": url + "contact/#loc-" + loc["id"],
            "image": url + f"assets/img/{loc['img']}-1280.webp", "telephone": "+31" + loc["phone"][1:],
            "servesCuisine": ["Gegrilde kip", "Halal"], "priceRange": "€", "hasMenu": url + "menu/",
            "address": {"@type": "PostalAddress", "streetAddress": loc["street"], "postalCode": loc["postcode"],
                        "addressLocality": loc["city"], "addressCountry": "NL"},
            "geo": {"@type": "GeoCoordinates", "latitude": loc["lat"], "longitude": loc["lng"]},
            "openingHoursSpecification": [{
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": loc["opens"], "closes": loc["closes"]}],
        })
    return {"@context": "https://schema.org", "@graph": graph}


def menu_ld():
    sections = []
    for c in MENU:
        items = []
        for g in c["groups"]:
            for it in g["items"]:
                name = it["n"] + (f" ({it['q']})" if it.get("q") else "")
                entry = {"@type": "MenuItem", "name": name,
                         "offers": {"@type": "Offer", "price": it["p"].replace(",", "."), "priceCurrency": "EUR"}}
                if it.get("d") or g.get("note"):
                    entry["description"] = it.get("d") or g["note"]
                items.append(entry)
        sections.append({"@type": "MenuSection", "name": c["title"], "hasMenuItem": items})
    return {"@context": "https://schema.org", "@type": "Menu", "name": "Menu Dilek Chicken",
            "url": DOMAIN + "menu/", "inLanguage": "nl", "hasMenuSection": sections}


def head(page, root):
    url = DOMAIN + page["path"]
    preload = ""
    if page.get("preload"):
        slug = page["preload"]
        srcset = ", ".join(f"{root}assets/img/{slug}-{w}.avif {w}w" for w, _ in IMAGES[slug])
        preload = (f'<link rel="preload" as="image" type="image/avif" imagesrcset="{srcset}" '
                   f'imagesizes="(min-width: 900px) 40vw, 100vw" fetchpriority="high">\n')
    ld = ""
    if page.get("ld") == "org":
        ld = f'<script type="application/ld+json">{json.dumps(org_ld(), ensure_ascii=False)}</script>\n'
    elif page.get("ld") == "menu":
        ld = f'<script type="application/ld+json">{json.dumps(menu_ld(), ensure_ascii=False)}</script>\n'
    robots = f'<meta name="robots" content="{page["robots"]}">\n' if page.get("robots") else ""
    return f'''<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(page['title'])}</title>
<meta name="description" content="{esc(page['description'])}">
{robots}<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta property="og:site_name" content="Dilek Chicken">
<meta property="og:title" content="{esc(page['title'])}">
<meta property="og:description" content="{esc(page['description'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{DOMAIN}assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Dilek Chicken: elke dag vers van het spit">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#17110d">
<link rel="icon" href="{root}assets/icons/favicon.ico" sizes="48x48">
<link rel="icon" href="{root}assets/icons/favicon-96.png" type="image/png" sizes="96x96">
<link rel="apple-touch-icon" href="{root}assets/icons/apple-touch-icon.png">
<link rel="manifest" href="{root}site.webmanifest">
<link rel="preload" href="{root}assets/fonts/archivo-var-latin.woff2" as="font" type="font/woff2" crossorigin>
{preload}<link rel="stylesheet" href="{root}assets/css/site.css?v={VERSION}">
<script>document.documentElement.classList.add('js');setTimeout(function(){{if(!window.__dilek)document.documentElement.classList.remove('js')}},2500)</script>
<script src="{root}assets/js/site.js?v={VERSION}" defer></script>
{ld}</head>'''


def header(page, root):
    links = []
    for key, label, href in NAV:
        cur = ' aria-current="page"' if page["nav"] == key else ""
        links.append(f'<li><a href="{root}{href}"{cur}>{label}</a></li>')
    socials = "".join(f'<a href="{u}" rel="noopener" target="_blank">{n}</a>' for n, u in SOCIAL)
    return f'''<body class="page-{page['nav']}">
<a class="skip" href="#main">Naar de inhoud</a>
<header class="site-header" data-header>
  <div class="wrap header-in">
    <a class="brand" href="{root}"><picture><source type="image/webp" srcset="{root}assets/img/logo-480.webp 480w, {root}assets/img/logo-971.webp 971w" sizes="240px"><img src="{root}assets/img/logo-480.png" width="480" height="80" alt="Dilek Chicken, naar de homepage"></picture></a>
    <nav class="nav" id="site-nav" aria-label="Hoofdmenu">
      <ul class="nav-list">{''.join(links)}</ul>
      <div class="nav-sheet-extra">
        <a class="btn btn-gold" href="{root}#locaties">Vind je Dilek</a>
        <p class="nav-socials">{socials}</p>
      </div>
    </nav>
    <a class="btn btn-red header-cta" href="{root}#locaties">Vind je Dilek</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="sr-only" data-label>Menu openen</span><span class="burger" aria-hidden="true"></span></button>
  </div>
</header>'''


def mobile_bar(page, root):
    mail_jobs = f"mailto:{EMAIL}?subject=" + quote("Sollicitatie")
    bars = {
        "catering": [("Bel ons", tel(LOCATIONS[0]["phone"]), False), ("Aanvraag doen", "#aanvraag", True)],
        "vacatures": [("Locaties", f"{root}#locaties", False), ("Solliciteer", mail_jobs, True)],
        "menu": [("Catering", f"{root}catering/", False), ("Route & tijden", f"{root}#locaties", True)],
        "contact": [("Menu", f"{root}menu/", False), ("Route & tijden", "#locaties", True)],
    }
    items = bars.get(page["nav"], [("Menu", f"{root}menu/", False), ("Route & tijden", f"{root}#locaties", True)])
    links = "".join(f'<a class="mbar-btn{" mbar-main" if main else ""}" href="{esc(h)}">{t}</a>' for t, h, main in items)
    return f'<nav class="mbar" aria-label="Snelkoppelingen">{links}</nav>'


def footer(page, root):
    cols = []
    for loc in LOCATIONS:
        cols.append(f'''<div class="f-col">
        <h2 class="f-h">{loc['name']}</h2>
        <address>{loc['street']}<br>{loc['postcode']} {loc['city']}</address>
        <p class="f-hours">Ma – zo · {loc['opens']} – {loc['closes']}</p>
        <p><a href="{tel(loc['phone'])}">{phone_fmt(loc['phone'])}</a> · <a href="{esc(route_url(loc))}" target="_blank" rel="noopener">Route</a></p>
      </div>''')
    socials = "".join(f'<li><a href="{u}" rel="noopener" target="_blank">{n}</a></li>' for n, u in SOCIAL)
    nav = "".join(f'<li><a href="{root}{h}">{label}</a></li>' for _, label, h in NAV)
    return f'''<footer class="site-footer">
  <div class="wrap">
    <div class="f-top">
      <p class="f-slogan">Kip eten doe je bij <em>Dilek&nbsp;Chicken.</em></p>
      <img class="f-mascot" src="{root}assets/img/mascot-320.webp" width="320" height="320" alt="" loading="lazy" decoding="async">
    </div>
    <div class="f-grid">
      {''.join(cols)}
      <div class="f-col">
        <h2 class="f-h">Volg ons</h2>
        <ul class="f-links">{socials}</ul>
        <h2 class="f-h">Mail</h2>
        <p><a href="mailto:{EMAIL}">{EMAIL}</a></p>
      </div>
    </div>
    <div class="f-bottom">
      <ul class="f-nav">{nav}<li><a href="{root}privacy/">Privacy</a></li></ul>
      <p>© <span data-year>2026</span> Dilek Chicken · Het spit staat nooit stil.</p>
    </div>
  </div>
</footer>
{mobile_bar(page, root)}
</body>
</html>
'''


PIC_RE = re.compile(r"\{\{pic\s+([a-z0-9-]+)\s*\|\s*([^|]*?)\s*(?:\|\s*(.*?))?\s*\}\}", re.S)


def expand(text, root):
    text = text.replace("{{locations}}", locations_html(root))
    text = text.replace("{{menu_nav}}", menu_nav_html())
    text = text.replace("{{menu}}", menu_html())
    text = text.replace("{{packages}}", packages_html())
    text = text.replace("{{package_options}}", package_options_html())
    text = text.replace("{{email}}", EMAIL)
    text = text.replace("{{mailto_jobs}}", f"mailto:{EMAIL}?subject=" + quote("Sollicitatie"))
    text = PIC_RE.sub(lambda m: pic(m.group(1), m.group(2), m.group(3) or "", root), text)
    text = text.replace("{{root}}", root)
    left = re.findall(r"\{\{[^}]*\}\}", text)
    if left:
        raise SystemExit(f"unexpanded tokens: {left[:5]}")
    return text


def main():
    for page in PAGES:
        depth = page["out"].count("/")
        root = "./" if depth == 0 else "../" * depth
        body = (SRC / page["src"]).read_text(encoding="utf-8")
        doc = head(page, root) + "\n" + header(page, root) + "\n" + body.strip() + "\n" + footer(page, root)
        doc = expand(doc, root)
        out = SITE / page["out"]
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(doc, encoding="utf-8")
        print("wrote", out.relative_to(SITE.parent))
    urls = "".join(f"  <url><loc>{DOMAIN}{p['path']}</loc></url>\n" for p in PAGES if not p.get("robots"))
    (SITE / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n',
        encoding="utf-8")


if __name__ == "__main__":
    main()
