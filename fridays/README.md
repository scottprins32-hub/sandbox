# Fridays Baby Truck: a rebuild

A research-led concept redesign of [fridays.cw](https://www.fridays.cw/) for Curaçao's best
known *trùk 'i pan*. Two products, one idea.

| File | What it is |
|---|---|
| `index.html` | The website. Trilingual marketing site, the full menu as the matrix it is, and the whole order flow from first question to a live collection ticket, plus the kitchen rail behind the hatch |
| `app.html` | The phone app. One device, one surface that changes identity through the night, with a dial on the plinth that scrubs a whole night of island time |

Both are a single self-contained HTML file. Fonts are subset and inlined, photography is
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
the restaurants closed. Fifty years on it is still how the island eats after dark: open
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
plain, sandwich, wrap, kapsalon`. Seventy-seven cells, eighteen of which are combinations
the kitchen does not do, leaving fifty-nine real ways to order a plate and sixty-eight
printed prices. It is a shape you can read in one glance, and the single most distinctive
thing about how the business works. The
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

**The website is the window seen from across the street, and then the window itself.**
It makes you hungry, it tells you whether the grill is lit and how deep the queue is, and
then it takes the order rather than handing you to somebody else's checkout. The menu is
presented as the matrix it actually is: pick a cut, pick a format, tap the price. Empty
cells say the kitchen does not do that combination, here, rather than letting you find out
at the hatch. Four hash routes carry it end to end: the marketing page, the four-question
builder, a live collection ticket that ages against the island clock, and the staff rail
that makes the quote true. Papiamentu, Dutch and English, switchable, through all four.

**The app is the window in your pocket.** A different posture from the site: operational,
tight, built around one object, and deliberately without a tab bar, because a tab bar spends
its best real estate advertising peers to a product that has none. It is one surface that
changes identity through the night. Cold before nine. Quoting a live fire time once the
coals are lit. And the moment an order goes in it stops being a home screen and becomes the
ticket: a timeline, a collection code, and instead of a status an instruction, the minute to
walk out of the door, computed from the queue and how far away you are. **Trempan** is the loyalty
mechanic: book a collection slot in the first two hours after the grill lights, 21:00 to
23:00, and the kitchen guarantees twelve minutes and takes Cg 2 off, because an empty grill
is worth more to them than a full one. Loyalty that
moves demand beats loyalty that stamps a card.

**The order flow is the window's grammar,** and it is the same four questions in both
products, off the same table of prices. In the truck's own order:
*Ki karni?* which cut. *Kon bo ke?* how do you want it. *Batata òf pan?* fries or bread.
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

The two products deliberately do not share a layout language. The site is editorial where
it sells and a tool where it takes an order: wide and photographic on the way in, then
visible structure, tabular numbers and every piece of state on screen at once once you are
building a plate. The app is operational throughout: one column, tight cards, live state,
four thumbnails and no other photography. They share a palette and a typeface, which is what
makes them one brand, and differ in posture, which is what makes each one right for its job.

The app's architecture was chosen against two alternatives rather than assumed. A four-tab
controller with per-tab navigation stacks and a five-tab variant were both drawn up in full
and both rejected: three independent reviews, judging separately for craft, for buildability
in one vanilla file, and for whether it serves somebody standing on Caracasbaaiweg at 23:40,
all landed on the single-surface shape. What survived from the others is the modal grammar
(a sheet you can throw away, a cover you must acknowledge), the lock screen with the push
already sitting on it, and the refused menu cell that explains itself at the moment of
asking instead of doing nothing.

## What is real and what is modelled

**Real.** Every plate price, format, opening hour, address, phone number and email is
transcribed from the December 2024 printed menu and from fridays.cw. The photography is
Fridays' own. The three reviews are the ones on their site, under the names given there.

**Modelled.** Queue depth and fire time are simulated from a curve peaking between 22:30
and 01:00, using one shared formula so both products quote the same number at the same
instant, verified at twelve session boundaries. They run against real Curaçao time, so the pages genuinely read differently at nine
in the evening and at two in the morning, but no live kitchen feeds them. Trempan, the fire
ticket, the rail and the governor are proposals, not existing features. So are the prices
the printed menu does not carry, and they are named as this concept's own in the site's
About panel, which is where they are charged: sides at Cg 2, the mitar mitar second grill
pass at Cg 3, extra batata at Cg 4, delivery at Cg 8, and the Cg 2 Trempan credit. The app's clock dial is a demo control and says so on the plinth: left
on Live it shows the truck as it actually is, which for most of the day is a cold grill.

**Needs a native pass.** The Papiamentu was written from sourced vocabulary, corrected once
in review (`preis` not `prijs`, `Djadumingu` not `Djadomingo`, `òf` not `o`, `tum'é` and
`tres'é` for the elided object clitic), and still not checked by a native speaker. A Curaçao
copywriter should go through it line by line before anything ships.

**Worth asking the owner.** The banner on the side of the truck, visible in their own
photography, reads "closed on Thuesday", while fridays.cw lists all seven days open. The
hours used here follow the website; the photograph used beside the hours table is cropped
above the banner rather than quietly showing a contradiction. The printed menu also shows
two prices for chicken at Regular (read here as a small and a large) and files Surf & Turf
Deluxe inside the Premium table rather than as its own line.

---

Concept work, not affiliated with Fridays Baby Truck. No payment is taken anywhere and
none of these pages are live.

## How it was checked

Nothing here was reviewed by eye alone. Both products are driven in a headless browser:
twelve session boundaries from 15:00 through 20:59, 21:00, 23:45, midnight, 01:59, 02:00 and
04:01, checked for agreement *between* the two products rather than only within each; the
order flow built end to end in both currencies and all three languages; a structural sweep at
ten widths from 320 to 1920 across every route and every app state, for sideways scroll,
clipped text, unnamed controls, duplicate ids, heading order and one tab stop per radio group;
a keyboard-only walkthrough of both order flows; and a contrast pass measured from **rendered
pixels** rather than computed from CSS, after the CSS-derived audit was caught reading
mid-animation opacity and reporting failures that were not there.

The design, accessibility, code, UX, craft and factual accuracy were then put through four
adversarial review rounds, each finding handed to a separate skeptic instructed to refute it
and to default to refuted when unsure. Thirty-one findings survived the first round, thirteen
the second, forty-three the third against twenty-nine refuted, and forty-three the fourth
against one refuted. All are fixed here.

The fourth round added a lens that reads the previous round's commits hunk by hunk and hunts
only for what those fixes broke, and it earned its place: the day-roll added in round three to
stop after-closing orders being born ready was applied unconditionally, which shoved the demo
presets' deliberately backdated tickets a day into the future; the slot grid's new lead-time
rule created a dead zone from 22:26 to 23:00 in which the sheet offered tomorrow's lane while
greying every slot in it; and the mitar mitar chips' new honest deltas were measured against a
plate that already contained the selected partner, so they all read plus Cg 0 the moment one
was chosen. The round also caught the app quoting "ready 02:10" beside "closes 02:00" because
only the site had a last-orders window, a skip link that silently ejected keyboard users from
the order flow because its href collided with the hash router, and a rail whose codes ran
backwards as the queue ebbed.

The third round is the one worth reading, because the two products had just been rewritten and
it found the class of fault a rewrite produces. A whole sheet, the app's headline Trempan
mechanic, had lost its three CSS rules in the rewrite and was opening as a 2700px blank column.
Half-and-half was unreachable for steak plus galiña, the most ordinary order at any truck
window, because the second cut was matched on a size-suffixed key rather than on the format
family. The kitchen rail subtracted clock-face minutes and gained a whole day every night at
midnight, on the one screen whose entire purpose is a minutes-left number. A ticket ordered
after closing was born already collected. A delivery charged Cg 8 and then told the customer
to drive to the truck. A review printed under a real name had been quietly reworded to delete
the competitor it named, which is the one finding here that was not a bug but a small dishonesty.

Two findings were rejected with reasons. "Juice lamunchi" is not our mis-ordered Papiamentu:
it is transcribed verbatim from the truck's printed menu, as is the Cg 5 it costs and the
Cg 45 three-protein mix, both of which a reviewer read as invented.
