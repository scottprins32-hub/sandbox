/* Dilek Chicken — one small script, no dependencies.
   The spit (hero drum), live opening status, nearest location, menu chips, catering bon. */
(() => {
  'use strict';
  window.__dilek = true;
  document.documentElement.classList.add('js'); // restore if the no-JS safety net already removed it

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const listNl = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} en ${a[a.length - 1]}`);

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- mobile nav ---------- */
  const toggle = $('.nav-toggle');
  if (toggle) {
    const label = $('[data-label]', toggle);
    const setOpen = (open) => {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Menu sluiten' : 'Menu openen';
      if (open) $('#site-nav a')?.focus();
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    $$('#site-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  revealEls.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el) * 0.08, 0.4)}s`);
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- page heroes click into place ---------- */
  const ready = (el) => requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-ready')));
  $$('.page-hero').forEach(ready);

  /* ---------- the spit: a drum of phrases that turns like a rotisserie ---------- */
  const hero = $('.hero');
  if (hero) initSpit(hero);

  function initSpit(hero) {
    const spit = $('.spit', hero);
    const drum = spit && $('.drum', spit);
    const title = $('.hero-title', hero);
    const btn = $('.spit-toggle', hero);
    const faces = drum ? $$('.face', drum) : [];
    const N = faces.length;
    if (!N) { ready(hero); return; }
    const STEP = 360 / N;
    faces.forEach((f, i) => f.style.setProperty('--i', i));

    let rot = reduce ? 0 : -360; // intro: one full spin back, then settle on face 0
    let base = 0;
    let scrollRot = 0;
    let raf = 0;
    let paused = false;
    let visible = true;
    let lastScroll = 0;
    let snapTimer = 0;

    const paint = () => {
      drum.style.setProperty('--rot', `${rot.toFixed(2)}deg`);
      faces.forEach((f, i) => {
        const a = ((((rot - i * STEP) % 360) + 540) % 360) - 180;
        const c = Math.cos((a * Math.PI) / 180);
        f.style.setProperty('--light', c > 0.5 ? (((c - 0.5) / 0.5) ** 2).toFixed(3) : '0');
      });
    };
    const frame = () => {
      raf = 0;
      const target = base + scrollRot;
      const d = target - rot;
      rot = Math.abs(d) < 0.05 ? target : rot + d * 0.085;
      paint();
      if (rot !== target) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    // Size the type so the longest phrase exactly fills the column, at any width.
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;padding-right:.2em;pointer-events:none';
    title.appendChild(probe);
    const fit = () => {
      title.style.removeProperty('--spit-size');
      const avail = spit.clientWidth;
      const widest = Math.max(...faces.map((f) => { probe.textContent = f.textContent; return probe.offsetWidth; }));
      if (!widest) return;
      const fs = parseFloat(getComputedStyle(title).fontSize);
      title.style.setProperty('--spit-size', `${Math.min(168, Math.floor((fs * avail * 0.98) / widest))}px`);
    };
    let rz = 0;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 120); });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
    fit();

    paint();
    ready(hero);
    if (reduce) { if (btn) btn.hidden = true; return; }
    kick();

    // Scroll turns the spit; when scrolling stops it settles on the nearest phrase.
    const snap = () => {
      const t = base + scrollRot;
      base += Math.round(t / STEP) * STEP - t;
      kick();
    };
    window.addEventListener('scroll', () => {
      const h = hero.offsetHeight || 1;
      scrollRot = (Math.min(window.scrollY, h * 1.2) / h) * STEP * 2.2;
      lastScroll = performance.now();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snap, 160);
      kick();
    }, { passive: true });

    // Left alone, it keeps turning — one phrase every few seconds. Pausable.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(spit);
    }
    setInterval(() => {
      if (!paused && visible && !document.hidden && performance.now() - lastScroll > 1500) { base += STEP; kick(); }
    }, 3200);
    if (btn) {
      btn.addEventListener('click', () => {
        paused = !paused;
        btn.classList.toggle('is-paused', paused);
      });
    }
  }

  /* ---------- live opening status (Europe/Amsterdam) ---------- */
  const locs = $$('[data-loc]');
  const summary = $('[data-live-summary]');
  const clock = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const nowMin = () => {
    const p = clock.formatToParts(new Date());
    return Number(p.find((x) => x.type === 'hour').value) * 60 + Number(p.find((x) => x.type === 'minute').value);
  };
  const LOCS = locs.map((el) => ({ el, name: el.dataset.name, open: toMin(el.dataset.open), close: toMin(el.dataset.close) }));

  const updateStatus = () => {
    const now = nowMin();
    LOCS.forEach((l) => {
      l.isOpen = now >= l.open && now < l.close;
      const st = $('[data-status]', l.el);
      let text;
      if (l.isOpen) text = l.close - now <= 45 ? `Sluit bijna · tot ${hhmm(l.close)}` : `Nu open · tot ${hhmm(l.close)}`;
      else if (now < l.open) text = `Gesloten · opent om ${hhmm(l.open)}`;
      else text = `Gesloten · morgen vanaf ${hhmm(l.open)}`;
      st.innerHTML = `<span class="dot" aria-hidden="true"></span>${text}`;
      st.classList.toggle('is-open', l.isOpen);
      st.hidden = false;
    });
    if (summary && LOCS.length) {
      const open = LOCS.filter((l) => l.isOpen).map((l) => l.name);
      const first = Math.min(...LOCS.map((l) => l.open));
      const dot = $('.dot', summary);
      $('[data-text]', summary).textContent = open.length
        ? `Nu open in ${listNl(open)}`
        : now < first ? `Nu dicht · vanaf ${hhmm(first)} weer open` : `Nu dicht · morgen vanaf ${hhmm(first)}`;
      dot.classList.toggle('is-open', open.length > 0);
      summary.hidden = false;
    }
  };
  if (LOCS.length) { updateStatus(); setInterval(updateStatus, 60000); }

  /* ---------- nearest location (asks for location only on click) ---------- */
  const nearBtn = $('[data-near]');
  const nearMsg = $('[data-near-msg]');
  if (nearBtn && locs.length) {
    if (!('geolocation' in navigator)) nearBtn.hidden = true;
    nearBtn.addEventListener('click', () => {
      nearBtn.disabled = true;
      nearMsg.textContent = 'Even zoeken…';
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: la, longitude: lo } = pos.coords;
        const R = 6371;
        const rad = (d) => (d * Math.PI) / 180;
        const dist = (el) => {
          const dLa = rad(el.dataset.lat - la);
          const dLo = rad(el.dataset.lng - lo);
          const a = Math.sin(dLa / 2) ** 2 + Math.cos(rad(la)) * Math.cos(rad(el.dataset.lat)) * Math.sin(dLo / 2) ** 2;
          return 2 * R * Math.asin(Math.sqrt(a));
        };
        const sorted = locs.map((el) => ({ el, km: dist(el) })).sort((a, b) => a.km - b.km);
        const wrap = $('[data-locs]');
        const kmTxt = (km) => `${km.toLocaleString('nl-NL', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
        sorted.forEach(({ el, km }, i) => {
          wrap.appendChild(el);
          el.classList.toggle('is-nearest', i === 0);
          const d = $('[data-dist]', el);
          d.textContent = kmTxt(km);
          d.hidden = false;
        });
        nearMsg.textContent = `Dichtstbij: ${sorted[0].el.dataset.name} (${kmTxt(sorted[0].km)}). De locaties staan nu op afstand.`;
        nearBtn.disabled = false;
      }, () => {
        nearMsg.textContent = 'Je locatie is niet beschikbaar. Kies hieronder zelf je Dilek.';
        nearBtn.disabled = false;
      }, { timeout: 10000, maximumAge: 300000 });
    });
  }

  /* ---------- menu chips follow the section in view ---------- */
  const chips = $$('.menu-nav a');
  if (chips.length && 'IntersectionObserver' in window) {
    const bar = $('.menu-nav ul');
    const byId = new Map(chips.map((a) => [a.hash.slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        chips.forEach((a) => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        const a = byId.get(en.target.id);
        if (!a) return;
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'true');
        bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.menu-cat').forEach((s) => io.observe(s));
  }

  /* ---------- catering: the bon writes itself while you fill in the form ---------- */
  const form = $('#catering-form');
  if (form) initCatering(form);

  function initCatering(form) {
    const bon = $('[data-bon]');
    const out = (k) => $(`[data-bon-${k}]`, bon);
    const amsterdamDate = (offsetDays) => {
      const d = new Date(Date.now() + offsetDays * 86400000);
      const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      return p; // YYYY-MM-DD
    };
    const date = form.elements.datum;
    date.min = amsterdamDate(1);
    const dateNl = (v) => {
      if (!v) return '';
      const [y, m, d] = v.split('-').map(Number);
      return new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(y, m - 1, d)));
    };

    $$('[data-pick]').forEach((a) => a.addEventListener('click', () => {
      const r = form.querySelector(`input[name="pakket"][value="${a.dataset.pick}"]`);
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      setTimeout(() => r && r.focus({ preventScroll: true }), reduce ? 0 : 600);
    }));

    const addr = $('[data-when="bezorgen"]', form);
    const pick = $('[data-when="ophalen"]', form);
    const setMode = () => {
      const mode = form.elements.levering.value;
      [[addr, 'bezorgen'], [pick, 'ophalen']].forEach(([wrap, m]) => {
        const on = mode === m;
        wrap.hidden = !on;
        $$('input,select,textarea', wrap).forEach((f) => { f.disabled = !on; f.required = on; });
      });
    };

    const pkg = () => form.querySelector('input[name="pakket"]:checked');
    const set = (k, v, empty = '—') => {
      const el = out(k);
      if (!el) return;
      el.textContent = v || empty;
      el.classList.toggle('is-empty', !v);
    };

    const render = () => {
      setMode();
      const p = pkg();
      const f = form.elements;
      set('pakket', p ? p.dataset.name : '', 'Nog geen pakket');
      set('personen', f.personen.value ? `${f.personen.value} personen` : '');
      set('datum', [dateNl(f.datum.value), f.tijd.value ? `${f.tijd.value} uur` : ''].filter(Boolean).join(', '));
      const mode = f.levering.value;
      set('levering', mode === 'bezorgen' ? `Bezorgen${f.adres.value ? `: ${f.adres.value.trim().split('\n').join(', ')}` : ''}`
        : mode === 'ophalen' ? `Ophalen${f.locatie.value ? ` in ${f.locatie.value}` : ''}` : '');
      set('naam', f.naam.value.trim());
      const items = out('items');
      items.innerHTML = '';
      if (p && p.dataset.items) {
        p.dataset.items.split('|').forEach((t) => { const li = document.createElement('li'); li.textContent = t; items.appendChild(li); });
      }
      items.hidden = !(p && p.dataset.items);
      set('totaal', p ? (p.dataset.price ? `€ ${p.dataset.price}` : 'Op aanvraag') : '', '€ —');
      out('bezorg').textContent = mode === 'ophalen' ? 'Ophalen' : 'Gratis';
    };
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    render();

    const note = $('[data-form-note]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const f = form.elements;
      const p = pkg();
      const lines = [
        'Catering-aanvraag via dilek-chicken.nl',
        '',
        `Pakket: ${p.dataset.name} (${p.dataset.people})${p.dataset.price ? ` – € ${p.dataset.price}` : ''}`,
        `Aantal personen: ${f.personen.value}`,
        `Datum: ${dateNl(f.datum.value)}${f.tijd.value ? `, ${f.tijd.value} uur` : ''}`,
        f.levering.value === 'bezorgen' ? `Bezorgen op: ${f.adres.value.trim().split('\n').join(', ')}` : `Ophalen in: ${f.locatie.value}`,
        '',
        `Naam: ${f.naam.value.trim()}`,
        `Telefoon: ${f.telefoon.value.trim()}`,
      ];
      if (f.email.value.trim()) lines.push(`E-mail: ${f.email.value.trim()}`);
      if (f.opmerkingen.value.trim()) lines.push('', 'Opmerkingen:', f.opmerkingen.value.trim());
      const subject = `Catering-aanvraag: ${p.dataset.name}, ${dateNl(f.datum.value)}`;
      window.location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\r\n'))}`;
      note.hidden = false;
    });
  }
})();
