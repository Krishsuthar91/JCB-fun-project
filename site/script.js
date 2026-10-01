(() => {
  'use strict';

  // ---- Config -------------------------------------------------------------
  const FRAME_COUNT = 179;
  const framePath = i => `frames/frame_${String(i).padStart(4, '0')}.jpg`;
  const BG = '#E2E3E2';   // must equal --bg in styles.css
  const EASE = 0.12;      // 0..1, lower = smoother/laggier
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Elements -----------------------------------------------------------
  const track = document.getElementById('story');
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d', { alpha: false });
  const nav = document.getElementById('nav');
  const bar = document.getElementById('progressBar');
  const beats = [...document.querySelectorAll('.beat')];
  const loader = document.getElementById('loader');
  const loaderPct = document.getElementById('loaderPct');
  const loaderBar = document.getElementById('loaderBar');

  // ---- State --------------------------------------------------------------
  const frames = new Array(FRAME_COUNT);
  let current = 0;        // eased frame (float)
  let target = 0;         // frame implied by scroll
  let progress = 0;       // 0..1 across the pinned track
  let lastDrawn = -1;
  let cw = 0, ch = 0, dpr = 1;
  let ready = false;

  // ---- Preload ------------------------------------------------------------
  function preload() {
    let loaded = 0;
    const tick = () => {
      loaded++;
      const pct = Math.round((loaded / FRAME_COUNT) * 100);
      loaderPct.textContent = pct;
      loaderBar.style.width = pct + '%';
      if (loaded === FRAME_COUNT) start();
    };
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        if (i === 0) { lastDrawn = -1; draw(0); }  // first frame ASAP
        tick();
      };
      img.src = framePath(i + 1);
      frames[i] = img;
    }
  }

  // ---- Canvas sizing & drawing -------------------------------------------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    lastDrawn = -1;
    draw(Math.round(current));
  }

  function draw(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;
    if (index === lastDrawn) return;
    lastDrawn = index;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cw, ch);

    // Landscape: cover. Portrait: fit width, so the machine stays whole.
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = cw >= ch ? Math.max(cw / iw, ch / ih) : cw / iw * 1.25;
    const w = iw * scale, h = ih * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // ---- Scroll → progress → target frame ----------------------------------
  function readScroll() {
    const rect = track.getBoundingClientRect();
    const distance = track.offsetHeight - window.innerHeight;
    progress = Math.min(1, Math.max(0, -rect.top / distance));
    target = progress * (FRAME_COUNT - 1);
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }

  // Fade/slide each caption in and out within its [from, to] window
  function updateBeats() {
    for (const el of beats) {
      const from = +el.dataset.from, to = +el.dataset.to;
      const t = (progress - from) / (to - from);
      let o = 0;
      if (t > 0 && t < 1) o = Math.min(1, t / 0.2, (1 - t) / 0.2);
      if (from === 0) o = Math.min(1, (1 - t) / 0.3, 1);          // hero: visible at start
      o = Math.max(0, Math.min(1, o));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateY(${((1 - o) * 16).toFixed(1)}px)`;
    }
    bar.style.transform = `scaleX(${progress})`;
  }

  // ---- Animation loop -----------------------------------------------------
  function loop() {
    current = reduceMotion ? target : current + (target - current) * EASE;
    if (Math.abs(target - current) < 0.01) current = target;
    draw(Math.round(current));
    updateBeats();
    requestAnimationFrame(loop);
  }

  function start() {
    ready = true;
    loader.classList.add('is-done');
    resize();
    readScroll();
    current = target;
    requestAnimationFrame(loop);
  }

  // ---- Init ---------------------------------------------------------------
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { resize(); readScroll(); });
  resize();
  readScroll();
  updateBeats();
  preload();
})();
