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

  /* ---------- the spit: a drum of phrases that turns like a rotisserie ----------
     The drum's spin speed also drives the heat haze on the grill photo: it flares when the spit turns fast. */
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
    spit.style.setProperty('--step', `${STEP}deg`);
    spit.style.setProperty('--r', `calc(var(--face-h) * ${(0.5 / Math.tan(Math.PI / N)).toFixed(4)})`);
    const state = { vel: 0, paused: false, visible: true };

    let rot = reduce ? 0 : -0.45 * STEP; // intro: "Dilek." rolls up into place on the first frame
    let base = 0;
    let scrollRot = 0;
    let raf = 0;
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
      const prev = rot;
      rot = Math.abs(d) < 0.05 ? target : rot + d * 0.085;
      state.vel = rot - prev;
      paint();
      if (rot !== target) raf = requestAnimationFrame(frame);
      else state.vel = 0;
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
      const widest = Math.max(...faces.map((f) => { probe.textContent = ($('.face-big', f) || f).textContent; return probe.offsetWidth; }));
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
      new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; if (state.wake) state.wake(); }).observe(hero);
    }
    // "Dilek." holds longest; the three locations follow.
    let lastTurn = performance.now() + 1200;
    setInterval(() => {
      const now = performance.now();
      const face = ((Math.round((base + scrollRot) / STEP) % N) + N) % N;
      const hold = face === 0 ? 5200 : 2600;
      if (!state.paused && state.visible && !document.hidden && now - lastScroll > 1500 && now - lastTurn > hold) {
        base += STEP; lastTurn = now; kick();
      }
    }, 250);
    if (btn) {
      btn.addEventListener('click', () => {
        state.paused = !state.paused;
        btn.classList.toggle('is-paused', state.paused);
        if (state.wake) state.wake();
      });
    }

    initHeat($('.hero-media', hero), state);
  }

  /* ---------- heat haze: the grill photo shimmers and throws embers (WebGL, optional) ---------- */
  function initHeat(media, state) {
    const pic = media && $('picture', media);
    const img = pic && $('img', pic);
    if (!img) return;
    // A desktop enhancement: phones keep the spit and the plain photo (battery, and they scroll past).
    // ?heat=1 forces it on for demos.
    const force = /[?&]heat=1(&|$)/.test(location.search);
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (!force && (!fine || saveData)) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'heat';
    canvas.setAttribute('aria-hidden', 'true');
    // failIfMajorPerformanceCaveat: no GPU (software WebGL) means the plain photo, not a CPU-burning shader.
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!gl) return;
    // Software WebGL (VMs, old laptops, headless browsers) would burn the CPU: skip it.
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    if (!force && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return;

    const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const FS = `precision mediump float;
      varying vec2 v;uniform sampler2D T;uniform vec2 R,I;uniform float t,h;
      float H(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float N(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
        return mix(mix(H(i),H(i+vec2(1,0)),u.x),mix(H(i+vec2(0,1)),H(i+vec2(1,1)),u.x),u.y);}
      vec2 cover(vec2 uv){float c=R.x/R.y,a=I.x/I.y;vec2 s=c>a?vec2(1.,a/c):vec2(c/a,1.);return (uv-.5)*s+.5;}
      void main(){
        vec2 uv=v;
        float rise=smoothstep(0.,.85,uv.y);
        vec2 d=vec2(N(vec2(uv.x*7.,uv.y*11.-t*1.7))-.5,N(vec2(uv.x*15.+3.,uv.y*24.-t*2.9))-.5);
        vec3 col=texture2D(T,cover(uv+d*(.0016+.0075*h*h)*(.35+.65*rise))).rgb;
        float glow=N(vec2(t*1.1,uv.x*2.));
        col+=vec3(1.,.42,.1)*(.025+.06*h)*glow*(1.-uv.y);
        float e=0.;vec2 q=vec2(uv.x*R.x/R.y,uv.y);
        for(int i=0;i<3;i++){float k=float(i);
          vec2 g=q*vec2(9.+k*5.,6.+k*3.);g.y-=t*(.55+k*.3)*(1.+h*.8);g.x+=sin(g.y*1.3+k*5.)*.3;
          vec2 c=floor(g),f=fract(g)-.5;float r=H(c+k*17.);
          vec2 o=vec2(H(c*1.7)-.5,H(c*2.3)-.5)*.55;
          float l=length(f-o);e+=step(.84-.06*h,r)*(smoothstep(.06,0.,l)+.35*smoothstep(.2,0.,l))*(.55+.45*sin(t*9.+r*50.))*(.35+.65*uv.y);}
        col+=vec3(1.,.55,.18)*e*(.9+.6*h);
        gl_FragColor=vec4(col,1.);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS);
    const fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uR = U('R'); const uI = U('I'); const uT = U('t'); const uH = U('h');

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1); // the photo must stay as sharp as the <img> it covers
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uR, canvas.width, canvas.height);
    };

    let raf = 0;
    let heat = 0.4;
    let last = 0;
    const t0 = performance.now();
    const draw = (now) => {
      raf = 0;
      // Idle shimmer runs at ~30 fps; a spinning spit gets the full frame rate.
      if (heat < 0.5 && now - last < 30) { raf = requestAnimationFrame(draw); return; }
      last = now;
      heat += (Math.min(1, 0.35 + Math.abs(state.vel) * 0.09) - heat) * 0.06;
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.uniform1f(uH, heat);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      state.heat = heat;
      if (!canvas.classList.contains('is-on')) canvas.classList.add('is-on');
      if (state.visible && !state.paused && !document.hidden) raf = requestAnimationFrame(draw);
    };
    state.wake = () => { if (!raf && state.visible && !document.hidden) raf = requestAnimationFrame(draw); };
    document.addEventListener('visibilitychange', state.wake);

    const start = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); } catch { return; }
      gl.uniform2f(uI, img.naturalWidth, img.naturalHeight);
      pic.after(canvas);
      resize();
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
      state.wake();
    };
    // Wait for the photo, then for an idle moment, before warming up the GPU.
    const go = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 400));
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
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
