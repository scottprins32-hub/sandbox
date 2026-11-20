// Runs before first paint: lets the stylesheet know scripts are on, and skips
// the flag curtain when it has already played in this tab.
document.documentElement.classList.add('js');
try { if (sessionStorage.getItem('oranje.seen')) document.documentElement.classList.add('no-curtain'); } catch { /* storage off */ }
// Navy is the default look; cream only when this browser chose it.
try { if (localStorage.getItem('oranje.look') === 'cream') document.documentElement.dataset.look = 'cream'; } catch { /* storage off */ }
// Language before first paint, so screen readers and hyphenation get it right.
try {
  const l = localStorage.getItem('oranje.lang');
  const nav = (navigator.languages || [navigator.language || '']).map((x) => String(x).toLowerCase());
  document.documentElement.lang = l === 'nl' || l === 'en' ? l : nav.some((x) => x === 'nl' || x.startsWith('nl-')) ? 'nl' : 'en';
} catch { /* storage off */ }
