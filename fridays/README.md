# Fridays Baby Truck: a rebuild

A research-led concept redesign of [fridays.cw](https://www.fridays.cw/) for Curaçao's best
known *trùk 'i pan*. Three surfaces, one idea.

| File | What it is |
|---|---|
| `index.html` | The hub. Research findings, the three surfaces, and an honest note on what is real and what is modelled |
| `01-website.html` | The marketing site. Trilingual, live fire time, the full menu as a matrix |
| `02-app.html` | The native app concept. Five working screens in phone frames |
| `03-ordering.html` | The ordering system. A working order builder, plus the kitchen rail behind it |

Each is a single self-contained HTML file. Fonts are subset and inlined, photography is
compressed and inlined as data URIs, icons are inlined SVG. Nothing is fetched at view
time, so they open straight from disk with no server and no build step.

```bash
# to regenerate them
pip install Pillow fonttools brotli
cd build && python3 build.py
```

`build/build.py` pulls the source photography from the CDN behind fridays.cw, crops and
compresses it, subsets the fonts from Google Fonts, fetches the Phosphor icons it needs,
and substitutes `{{FONTS}}`, `{{IMG:key}}`, `{{ICON:name}}` and `{{IMGJSON:...}}` tokens in
`build/src/*.html`. Downloads are cached in `build/.cache/`.

---

## What a trùk 'i pan is

Papiamentu for "bread truck". In the 1970s and 80s Curaçao's bread delivery vans finished
their rounds by morning and sat idle overnight. Drivers began cutting a service window into
the side, bolting a charcoal grill underneath, and selling to whoever was still out after
the restaurants closed. Forty years later it is still how the island eats after dark: open
around 21:00, running to 02:00 on a weeknight and past 04:00 on a Friday, everything cooked
to order over charcoal, eaten standing up.

The vocabulary that matters, because it is the actual grammar of an order:

| Papiamentu | Meaning |
|---|---|
| `pan ku…` | sandwich with…, the start of a large share of orders |
| `batata` | fries, soft-fried, the default side |
| `funchi` | cornmeal, like polenta |
| `aros moro` | rice and beans |
| `galiña` | chicken |
| `lomitu` | beef tenderloin |
| `karkó` | queen conch |
| `karni stobá` | stewed meat |
| `mitar mitar` | half and half, two proteins on one plate |
| `ku sous` | with sauce |
| `sin salu` | without salt |
| `pika` | spicy onion relish |
| `salsa rosada` | mayonnaise and ketchup |
| `sous di pinda` | peanut sauce |
| `dushi` | delicious |
| `bon nochi` | good evening |
| `trempan` | early |

## What Fridays is

Trading since 2018 at Caracasbaaiweg 216, Willemstad. Reputationally the island's best
truck, and priced like a restaurant rather than a snack van: Jack Daniels ribs and wings,
picanha, rib eye, conch, surf and turf, Caesar salads at one in the morning. Their own
motto: *"Small in size.. Huge in flavours!!"* The food photography on their site is
genuinely good, and this rebuild uses it rather than replacing it.

---

## What the research turned up

**1. The menu is a matrix and every surface flattens it.**
The printed menu is eleven cuts against seven formats: `regular, large, caesar salad,
plain, sandwich, wrap, kapsalon`. That is seventy-seven prices in a shape you can read in
one glance, and it is the single most distinctive thing about how the business works. The
website shows eight "signatures" as a flat list. The full menu is a 1.5 MB JPEG scan of an
A4 poster, which cannot be searched, translated, tapped, or read by a screen reader.

**2. Nobody quotes the wait, and the wait is the product.**
Reviewers put the walk-up wait at around forty minutes on a busy night, and advise ordering
ahead. Orders open at 19:30, ninety minutes before the grill lights at 21:00. Not one
surface, on the site, in the app or at checkout, tells you how long anything will take.
The surprise therefore lands at the window, where it costs the most.

**3. One page, one language.**
fridays.cw is a single Webflow page. Every link is an anchor, a `tel:`, a `mailto:`, the
menu JPEG, a Google Maps pin, or an app-store redirect. It is English only, on an island
whose first language is Papiamentu. The footer still reads 2023.

**4. The prices are in a currency that no longer exists.**
The menu quotes `ƒ` and `Ang.` The Netherlands Antillean guilder was replaced by the
Caribbean guilder (XCG, written `Cg`) on 31 March 2025 and stopped being legal tender on
1 July 2025. XCG is pegged at USD 1 = 1.79.

**5. Four unconnected front doors.**
Phone, a generic embedded ordering widget (`fbgcdn.com/embedder/js/ewm2.js`), a
white-labelled build of FTER9 (a shared island ordering platform), and walking up. None of
them share a queue, so none of them can quote a real time, and the customer relationship
sits with the aggregator rather than with Fridays.

### Sources

- [fridays.cw](https://www.fridays.cw/) and its December 2024 menu JPEG
- [Truck di Pan op Curacao, curacao-abc.nl](https://curacao-abc.nl/truck-di-pan-op-curacao/)
- [Truk'i Pan: Curaçao's Best Street Food, curacaoactivities.com](https://curacaoactivities.com/truki-pan-curacaos-best-street-food/)
- [Trùk 'i pan, palabricks.nl](https://palabricks.nl/blog/truki-pan) (Papiamentu vocabulary)
- [Truk'i Pan, inyourpocket.com](https://www.inyourpocket.com/Curacao/Curacao-Restaurants/Truk-di-Pan)
- [Fridays Baby Truck on Tripadvisor](https://www.tripadvisor.com/Restaurant_Review-g147278-d17213127-Reviews-Fridays_Baby_Truck-Willemstad_Curacao.html)
- [FTER9 ordering platform](https://www.fter9.com/)
- [Caribbean guilder, Wikipedia](https://en.wikipedia.org/wiki/Caribbean_guilder) and [Orbitax on the changeover](https://orbitax.com/news/country/article/Curacao-and-Sint-Maarten-Imple-58572)
- [Papiamentu phrases, Avila Beach Hotel](https://www.avilabeachhotel.com/curacao-tips/all-blog-posts/words-and-sentences-in-papiamentu/)

---

## The idea

> A trùk 'i pan has exactly one interface: a lit window in the side of a van, at night.
> You walk up, you say what you want in Papiamentu, someone puts it on charcoal, and you
> wait in the warm dark. Every digital surface should behave like that window.

**The website is the window seen from across the street.** It makes you hungry, it tells
you whether the grill is lit and how deep the queue is, and it hands you to the window.
The menu is presented as the matrix it actually is: pick a cut, pick a format, tap the
price. Empty cells say the kitchen does not do that combination, here, rather than letting
you find out at the hatch. Papiamentu, Dutch and English, switchable.

**The app is the window in your pocket.** A different posture from the site: operational,
tight, built around one object. Your order becomes a live fire ticket with a timeline and a
collection code, and instead of reporting a status it gives an instruction, "leave in six
minutes", computed from the queue and how far away you are. **Trempan** is the loyalty
mechanic: book a slot between 19:30 and 21:30 and the kitchen guarantees twelve minutes and
takes Cg 2 off, because an empty grill is worth more to them than a full one. Loyalty that
moves demand beats loyalty that stamps a card.

**The ordering system is the window's grammar.** Four questions in the truck's own order:
*Ki karni?* which cut. *Kon bo ke?* how do you want it. *Batata o pan?* fries or bread.
*Ku sous?* with sauce. Including **mitar mitar**, half and half, which is the most requested
thing at a truk window and which no ordering system on the island supports. Behind it, the
half nobody designs: a kitchen rail that groups tickets by cut so the grill cook fires four
chicken once instead of four times, and a governor that changes the system's own behaviour
as the queue deepens instead of quoting twenty minutes and hoping.

---

## Design notes

Palette and type are derived from Fridays' own material rather than invented. The amber
`#FABE4C` is sampled directly from the printed menu; the warm charcoal `#24211C` is sampled
from their fire photography. Type is Big Shoulders Display for condensed poster headlines,
Instrument Sans for interface text, and Instrument Serif italic for the Papiamentu, which
gives the second language its own voice instead of setting it in parentheses.

The three surfaces deliberately do not share a layout language. The site is editorial:
wide, photographic, asymmetric. The app is operational: tight cards, live state, almost no
photography. The ordering system is a tool: visible structure, tabular numbers, everything
on screen at once. They share a palette and a typeface, which is what makes them one brand,
and differ in posture, which is what makes each one right for its job.

## What is real and what is modelled

**Real.** Every price, format, opening hour, address, phone number and email is transcribed
from the December 2024 printed menu and from fridays.cw. The photography is Fridays' own.
The three reviews are the ones on their site, under the names given there.

**Modelled.** Queue depth and fire time are simulated from a curve peaking between 22:30
and 01:00. They run against real Curaçao time, so the pages genuinely read differently at
nine in the evening and at two in the morning, but no live kitchen feeds them. Trempan, the
fire ticket, the rail and the governor are proposals, not existing features.

**Needs a native pass.** The Papiamentu was written from sourced vocabulary and checked
against dictionaries, not by a native speaker. A Curaçao copywriter should go through it
line by line before anything ships. Two menu details are also worth confirming with the
kitchen: the printed menu shows two prices for chicken at Regular (read here as a small and
a large), and lists Surf & Turf Deluxe inside the Premium table rather than as its own item.

---

Concept work, not affiliated with Fridays Baby Truck. No payment is taken anywhere and
none of these pages are live.
