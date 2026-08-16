# Theme switching: three states, no flash, and everything that isn't CSS

Read this when implementing or debugging a theme toggle, or when something on the page refuses to follow the
theme — images, charts, native controls, embeds, print, or Windows High Contrast mode. SKILL.md move 8 has the
CSS structure; this has the implementations and the surfaces that CSS alone does not reach.

## The three states, restated as a contract

| Stored value | `data-theme` | `color-scheme` resolves to | Meaning |
|---|---|---|---|
| absent | absent | `light dark` → whatever the OS says | Follow the system (the default) |
| `"light"` | `light` | `light` | Force light, even on a dark system |
| `"dark"` | `dark` | `dark` | Force dark, even on a light system |

Label the third option **"System"** in the UI, not "Auto" — it tells the user where the setting comes from and
where to change it. Three radio buttons or a segmented control beats a two-state switch, which cannot express
"follow the system" at all and silently strands anyone who never touches it.

## Vanilla: the complete implementation

```html
<!-- In <head>, BEFORE any stylesheet. Inline and synchronous — defer/async reintroduces the flash. -->
<script>
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}                       /* private mode / disabled storage → fall through to system */
</script>
```

```js
// theme.js — loaded normally, after paint.
const mq = matchMedia('(prefers-color-scheme: dark)');
const root = document.documentElement;

export const getTheme = () => root.dataset.theme ?? 'system';
export const resolved = () => getTheme() === 'system' ? (mq.matches ? 'dark' : 'light') : getTheme();

export function setTheme(mode) {                       // 'light' | 'dark' | 'system'
  if (mode === 'system') { delete root.dataset.theme; localStorage.removeItem('theme'); }
  else { root.dataset.theme = mode; localStorage.setItem('theme', mode); }
  syncMeta();
}

// <meta name="theme-color" media="..."> follows the SYSTEM, so an explicit override needs help.
function syncMeta() {
  const dark = resolved() === 'dark';
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const m = document.createElement('meta');
  m.name = 'theme-color';
  m.content = dark ? '#15171C' : '#FFFFFF';
  document.head.append(m);
}

mq.addEventListener('change', syncMeta);                // system flipped while the page is open
addEventListener('storage', e => {                      // another tab changed the preference
  if (e.key !== 'theme') return;
  const v = e.newValue;
  if (v === 'light' || v === 'dark') root.dataset.theme = v; else delete root.dataset.theme;
  syncMeta();
});
syncMeta();
```

The `storage` listener is the difference between a toggle that feels like a product setting and one that feels
like a page setting. It fires only in *other* tabs, which is exactly the behaviour you want.

## React

The provider does nothing on mount except read what the head script already applied — it must never be the
thing that first sets the theme, or you have moved the flash into React's lifecycle.

```jsx
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Initialise from the DOM, which the head script already set. Not from localStorage,
  // and not from a default — either would render one frame of the wrong theme.
  const [theme, setThemeState] = useState(
    () => (typeof document === 'undefined' ? 'system'
                                           : document.documentElement.dataset.theme ?? 'system'));

  const setTheme = useCallback(mode => {
    const root = document.documentElement;
    if (mode === 'system') { delete root.dataset.theme; localStorage.removeItem('theme'); }
    else { root.dataset.theme = mode; localStorage.setItem('theme', mode); }
    setThemeState(mode);
  }, []);

  useEffect(() => {
    const onStorage = e => { if (e.key === 'theme') setThemeState(e.newValue ?? 'system'); };
    addEventListener('storage', onStorage);
    return () => removeEventListener('storage', onStorage);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
```

Render the control as a three-way `radiogroup`, and make the current state readable without colour:

```jsx
<fieldset role="radiogroup" aria-label="Colour theme">
  {['light', 'dark', 'system'].map(mode => (
    <label key={mode}>
      <input type="radio" name="theme" value={mode}
             checked={theme === mode} onChange={() => setTheme(mode)} />
      {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
    </label>
  ))}
</fieldset>
```

A single icon-only sun/moon button is the common shipped version and it is worse: it cannot express three
states, and it is ambiguous about whether the icon shows the *current* theme or the one you would switch to.
If you must ship one, give it an explicit `aria-label` naming the action ("Switch to dark theme") and cycle
through all three.

## Next.js / SSR: the flash in detail

The server cannot know the user's stored preference unless you put it somewhere the server can read. Three
options, in increasing order of correctness:

**1. Inline head script (localStorage).** Works for static export and every framework. The HTML ships
theme-less and the script sets the attribute before first paint, so there is no *visible* flash — but the
server-rendered markup does not match, so any server-rendered component that branches on theme is wrong. Keep
theme branching in CSS and this is fine. In App Router:

```jsx
// app/layout.jsx
export default function RootLayout({ children }) {
  const script = `try{var t=localStorage.getItem('theme');
    if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: script }} /></head>
      <body>{children}</body>
    </html>
  );
}
```

`suppressHydrationWarning` on `<html>` is required and is safe here: it suppresses the mismatch warning for
that element's attributes only, and the mismatch is the script's intended effect.

**2. Cookie.** The server reads the preference and renders the attribute directly, so SSR markup is correct
and no inline script is needed. Costs a cookie and makes the page user-specific — check it against your
caching strategy before choosing it.

```jsx
import { cookies } from 'next/headers';
const theme = (await cookies()).get('theme')?.value;          // 'light' | 'dark' | undefined
return <html lang="en" data-theme={theme === 'light' || theme === 'dark' ? theme : undefined}>…</html>;
```

**3. No JavaScript at all.** If you do not offer an override, `color-scheme: light dark` plus `light-dark()`
gives system-following theming with zero script and zero flash. Many products need nothing more. Offer the
override only when you have a reason to; the flash bug does not exist if the feature does not.

**The failure mode to recognise:** setting the theme in `useEffect`, in a client component's first render, or
in any deferred/async script. All three run after first paint. Symptom: a white flash on hard reload for dark
users, worst on slow connections and most visible on a cold cache.

## Reading token values in JavaScript

Canvas, WebGL, chart libraries and anything drawing to a bitmap cannot use CSS variables. Resolve them at
draw time and redraw on theme change — never hardcode a parallel palette in JS, which is how the chart ends
up the one thing on the page still using the old brand blue.

```js
const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function draw() {
  ctx.fillStyle   = token('--color-surface-raised');
  ctx.strokeStyle = token('--color-border-strong');
}

// Redraw on both switch paths: the system flipping, and the user overriding.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
new MutationObserver(draw).observe(document.documentElement,
                                   { attributes: true, attributeFilter: ['data-theme'] });
```

`getComputedStyle` returns the *resolved* value, so `light-dark()` and `var()` chains come back as a usable
colour string. It is a layout-flushing read — resolve once per draw, not once per mark. Chart-specific palette
guidance (categorical hues, sequential ramps, series distinguishable without colour) belongs to `dataviz`.

## Forced colors / Windows High Contrast mode

A separate system from dark mode, and the one most teams have never opened. When a user enables a Windows (or
Edge) contrast theme, the browser **replaces author colours with the user's chosen palette**. Your tokens stop
applying. That is the point — but any information you encoded purely as a colour or a shadow disappears with
them.

```css
@media (forced-colors: active) {
  /* Restore boundaries that were carried by background colour alone. */
  .btn, .card, .chip { border: 1px solid ButtonBorder; }

  /* Use system colour keywords, never hardcoded values, inside this block. */
  :focus-visible { outline: 2px solid Highlight; outline-offset: 2px; }
  .is-selected   { background: Highlight; color: HighlightText; }
  .link          { color: LinkText; }
  .is-disabled   { color: GrayText; }
}
```

The keywords come from CSS Color 4: `Canvas`, `CanvasText`, `LinkText`, `VisitedText`, `ActiveText`,
`ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`, `FieldText`, `Highlight`, `HighlightText`, `GrayText`,
`AccentColor`, `AccentColorText`, `Mark`, `MarkText`.

Specifics that bite:

- **Box shadows are dropped.** Anything whose only boundary was a shadow — cards, popovers, dropdowns — becomes
  indistinguishable from the page. Add a border in the media query.
- **Icons drawn as CSS `background-image` can vanish.** Inline SVG with `fill: currentColor` inherits the
  forced text colour and survives.
- **`forced-color-adjust: none`** opts an element out entirely. It is correct for the rare case where the
  colour *is* the content — a colour-swatch picker, a brand preview — and wrong everywhere else. Whenever you
  use it, the element must also carry a text label, since the user's whole reason for enabling forced colours
  is that they cannot rely on your colours.
- **Test it**: Chrome DevTools → Rendering → "Emulate CSS media feature forced-colors: active". Do this on the
  same pass as the CVD simulations; both take a minute and both find real bugs.

## Images, illustrations, syntax and embeds

- **Photographs**: leave them alone by default. A blanket `filter: brightness(0.85)` on all images is a
  legitimate taste choice to reduce glare against a dark surface, and it is also how you desaturate a product
  photo a customer is trying to evaluate. If you use it, exclude product imagery and avatars.
- **Logos and illustrations with baked-in backgrounds**: ship a second asset and art-direct it, rather than
  filtering. This is the only reliable approach for anything with white knocked out of it.
  ```html
  <picture>
    <source srcset="/logo-dark.svg" media="(prefers-color-scheme: dark)">
    <img src="/logo-light.svg" alt="Acme">
  </picture>
  ```
  Note this keys off the *system*, not your override. For a full override-aware version, swap the `src` in the
  theme change handler, or use inline SVG with `currentColor` and CSS variables — which is better anyway.
- **Inline SVG** is the right format for icons and simple illustrations precisely because it can reference
  `currentColor` and `var(--color-*)` and therefore themes for free.
- **Syntax highlighting** needs a genuinely second theme, not a dimmed first one. Highlight themes encode
  meaning in hue; naive darkening collapses distinctions between token types and usually breaks contrast on
  comments first. Ship a light theme and a dark theme and switch the stylesheet.
- **Third-party iframes** (maps, video, payment fields, analytics widgets) do not inherit your theme. Most
  expose a theme parameter — pass the resolved value and update it on change. Stripe Elements, Google Maps and
  most video players all support this. An unthemed white iframe in a dark page is a visible seam, and worse,
  a bright rectangle against a dark surround is exactly the glare dark mode existed to avoid.
- **Print**: force light. Dark backgrounds either waste an enormous amount of ink or get dropped by the
  browser's background-graphics setting, leaving light text on white paper.
  ```css
  @media print {
    :root { color-scheme: light; }
    body { background: #fff; color: #000; }
  }
  ```
- **Email**: `prefers-color-scheme` support across clients is partial and some clients force their own colour
  inversion on your markup regardless. Design email to survive inversion — adequate contrast in both
  directions, no text baked into images, no meaning carried by a background colour alone — rather than trying
  to control it.

## Test pass

Run this whenever the palette or the toggle changes:

- [ ] Hard reload with system dark + no stored preference: renders dark, no flash.
- [ ] Hard reload with system light + stored `dark`: renders dark, no flash.
- [ ] Hard reload with system dark + stored `light`: renders light, no flash.
- [ ] Flip the OS theme with the page open: follows, if and only if the setting is "System".
- [ ] Change the theme in a second tab: the first tab follows.
- [ ] Native `<select>`, date input, scrollbar, text caret and text selection all match the theme.
- [ ] Mobile browser address bar matches, including after an explicit override.
- [ ] Private browsing / storage disabled: no exception, falls back to system.
- [ ] Charts, canvas and syntax highlighting re-render on both switch paths.
- [ ] Third-party iframes themed or visually contained.
- [ ] `forced-colors: active` emulation: nothing disappears; cards and buttons keep a boundary.
- [ ] Print preview: readable on white.
- [ ] Reduced motion: no full-page colour animation on switch.
