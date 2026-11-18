// Apply the saved look before the first paint.
try {
  if (localStorage.getItem('oranje.look') === 'cream') document.documentElement.dataset.look = 'cream';
} catch { /* storage off */ }
