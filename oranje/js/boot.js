// Runs before first paint: lets the stylesheet know scripts are on, and skips
// the flag curtain when it has already played in this tab.
document.documentElement.classList.add('js');
try { if (sessionStorage.getItem('oranje.seen')) document.documentElement.classList.add('no-curtain'); } catch { /* storage off */ }
