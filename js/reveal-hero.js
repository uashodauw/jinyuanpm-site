/* Draw-to-reveal hero: FRONT (helmet) over BACK (person), dry-brush mask with heal-over-time, sparks & bolts. */
(function () {
  var hero = document.getElementById('hero');
  if (!hero || hero.__rv) return; hero.__rv = 1;
  /* teardown bookkeeping so the client-side router can stop this cleanly (no leaked listeners / observers / RAF) */
  var offs = [], dead = false;
  function on(t, n, f, o) { t.addEventListener(n, f, o); offs.push(function () { t.removeEventListener(n, f, o); }); }
  var front = document.getElementById('rv-front'), sparks = document.getElementById('rv-sparks');
  var fctx = front.getContext('2d'), sctx = sparks.getContext('2d');
  var scratch = document.createElement('canvas'), xctx = scratch.getContext('2d');
  var mask = document.createElement('canvas'), mctx = mask.getContext('2d');
  var AR = 1672 / 941, HOLD = 250, FADE = 600, MAXP = 900;
  var W = 0, H = 0, DPR = 1, cover = {x: 0, y: 0, w: 0, h: 0}, brushR = 40;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pts = [], parts = [], bolts = [], last = null, dirty = true, running = false, visible = true, raf = 0;

  function load(src) { return new Promise(function (res) { var i = new Image(); i.decoding = 'async'; i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  var webp = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
  var ext = webp ? '.webp' : '.png', V = '?v=7';
  var IMG = {};

  // ---- brush stamp (dry brush) ----
  var stamp = document.createElement('canvas'); stamp.width = stamp.height = 256;
  (function () {
    var c = stamp.getContext('2d'), R = 128, g = c.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.5, 'rgba(0,0,0,.95)'); g.addColorStop(.78, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 220; i++) {
      var a = Math.random() * 6.283, rr = R * (.55 + Math.random() * .42);
      c.save(); c.translate(R + Math.cos(a) * rr, R + Math.sin(a) * rr); c.rotate(a + Math.PI / 2 + (Math.random() - .5) * .5);
      c.globalAlpha = .15 + Math.random() * .5; c.beginPath(); c.ellipse(0, 0, 3 + Math.random() * 11, .4 + Math.random() * 1.2, 0, 0, 6.283); c.fill(); c.restore();
    }
    c.globalCompositeOperation = 'destination-out';
    for (i = 0; i < 140; i++) {
      var b = Math.random() * 6.283, r2 = R * (.35 + Math.random() * .6);
      c.beginPath(); c.arc(R + Math.cos(b) * r2, R + Math.sin(b) * r2, .4 + Math.random() * 1.6, 0, 6.283); c.fill();
    }
  })();

  // ---- layout / hero rect ----
  var copyEl = hero.querySelector('.rv-copy'), tagEl = hero.querySelector('.rv-tag');
  var TOP = 8 / 941; // helmet dome starts 8px below the top of the source frame
  function tagBox() { // visual box of the rotated/stretched tag, minus the entrance translate
    var r = tagEl.getBoundingClientRect(), hr = hero.getBoundingClientRect(), m = getComputedStyle(tagEl).transform, ty = 0;
    if (m && m !== 'none') { var v = m.match(/-?[\d.]+/g); ty = +v[v.length - 1] || 0; }
    return {top: r.top - hr.top - ty, bottom: r.bottom - hr.top - ty, h: r.height};
  }
  function layout() {
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height; DPR = Math.min(window.devicePixelRatio || 1, 2);
    [front, sparks, scratch].forEach(function (c) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    mask.width = Math.round(W * .5); mask.height = Math.round(H * .5);
    var portrait = W < H, w;
    if (portrait) {
      // tag sits right under the copy; the bust is sized so the helmet dome starts just under the tag
      var cb = copyEl.offsetTop + copyEl.offsetHeight;
      tagEl.style.top = cb + 'px'; var tb = tagBox();
      tagEl.style.top = (cb + (cb - tb.top) + 6) + 'px'; tb = tagBox();
      var helmetTop = tb.bottom - tb.h * .3, hMax = (H - helmetTop) / (1 - TOP);
      w = Math.min(H * AR, W * (W < 600 ? 2.3 : 1.9), hMax * AR);
      w = Math.max(w, W * 1.1);
    } else {
      tagEl.style.top = '';
      w = H * .97 * AR; // fit height with a little headroom: the whole helmet is visible, bust reaches the bottom edge
    }
    var h = w / AR, x = W * (portrait ? .5 : .6) - w * .655;
    x = Math.max(x, W - w);                                  // keep the right shoulder running off the right edge
    x = Math.min(x, W * (portrait ? .62 : .70) - w * .655);  // ...unless that pushes the face too far right
    var y = h <= H ? H - h : 0;                              // bottom-anchored
    cover = {x: x, y: y, w: w, h: h, fade: x + w < W - .5};
    brushR = Math.max(38, Math.min(W, H) * (W < 820 ? .11 : .075));
    dirty = true;
  }

  // ---- input ----
  function rel(e) { var r = hero.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
  function blocked(e) { var t = e.target; return t && t.closest && t.closest('.rv-header,.rv-card,.rv-menu'); }
  function addPoint(p, now) {
    if (!last) { last = {x: p.x, y: p.y}; return; }
    var dx = p.x - last.x, dy = p.y - last.y, dist = Math.hypot(dx, dy); if (dist < .5) return;
    var r = brushR * Math.min(1.35, .9 + dist / 180), step = Math.max(3, r * .22), n = Math.ceil(dist / step), ang = Math.atan2(dy, dx);
    for (var k = 1; k <= n; k++) {
      var t = k / n, jr = r * (1 + (Math.random() - .5) * .12) * (.9 + Math.random() * .2);
      pts.push({x: last.x + dx * t + (Math.random() - .5) * r * .12, y: last.y + dy * t + (Math.random() - .5) * r * .12, r: jr, a: ang, rot: Math.random() * 6.283, t: now});
    }
    if (pts.length > MAXP) pts.splice(0, pts.length - MAXP);
    var ns = Math.min(9, dist / 7) | 0;
    for (k = 0; k < ns; k++) {
      var sa = Math.random() * 6.283, sp = 1.4 + Math.random() * 5;
      parts.push({x: p.x, y: p.y, vx: Math.cos(sa) * sp, vy: Math.sin(sa) * sp, life: 1, d: .02 + Math.random() * .035, hue: Math.random() < .7 ? 160 : 186});
    }
    if (Math.random() < Math.min(.6, dist / 70)) {
      var ba = Math.random() * 6.283;
      bolt(p.x + Math.cos(ba) * brushR * .55, p.y + Math.sin(ba) * brushR * .55, ba, brushR * (.7 + Math.random() * .9), 6);
    }
    last = {x: p.x, y: p.y};
  }
  function bolt(x, y, a, len, seg) {
    var pts2 = [[x, y]], sl = len / seg;
    for (var i = 0; i < seg; i++) { a += (Math.random() - .5) * 1.1; x += Math.cos(a) * sl; y += Math.sin(a) * sl; pts2.push([x, y]); }
    bolts.push({p: pts2, life: 1});
  }
  function onMove(e) {
    if (blocked(e)) { last = null; return; }
    var touch = e.pointerType !== 'mouse';
    if (touch && !(e.buttons > 0 || e.pressure > 0)) { last = null; return; }
    var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!evs || !evs.length) evs = [e];
    var now = performance.now();
    for (var i = 0; i < evs.length; i++) addPoint(rel(evs[i]), now);
    kick();
  }
  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' && !blocked(e)) { last = null; addPoint(rel(e), performance.now()); } });
  ['pointerenter', 'pointerleave', 'pointercancel'].forEach(function (n) { hero.addEventListener(n, function () { last = null; }); });
  hero.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') last = null; });

  // ---- render ----
  function drawImg(ctx, img) {
    ctx.drawImage(img, cover.x * DPR, cover.y * DPR, cover.w * DPR, cover.h * DPR);
    if (cover.fade) { // image ends before the right edge (ultra-wide): fade the cut shoulder into the background
      var x1 = (cover.x + cover.w) * DPR, x0 = x1 - cover.w * .09 * DPR, g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0 + 1, ctx.canvas.height); ctx.restore();
    }
  }
  function compose(now) {
    // heal: drop dead points, paint mask
    var life = HOLD + FADE, i = 0;
    while (i < pts.length && now - pts[i].t > life) i++;
    if (i) pts.splice(0, i);
    var F = IMG.front, B = IMG.back;
    fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.globalCompositeOperation = 'source-over'; fctx.clearRect(0, 0, front.width, front.height);
    if (!pts.length) { drawImg(fctx, F); dirty = false; return; }
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mask.width, mask.height);
    for (i = 0; i < pts.length; i++) {
      var p = pts[i], age = now - p.t, al = 1, sh = 1;
      if (age > HOLD) { var u = 1 - (age - HOLD) / FADE; u = Math.max(0, Math.min(1, u)); al = u * u * (3 - 2 * u); sh = .75 + .25 * al; }
      var r = p.r * sh * .5;
      mctx.globalAlpha = al;
      mctx.setTransform(1, 0, 0, 1, p.x * .5, p.y * .5); mctx.rotate(p.a + p.rot * .15); mctx.scale(1.25, 1);
      mctx.drawImage(stamp, -r, -r, r * 2, r * 2);
    }
    mctx.globalAlpha = 1; mctx.setTransform(1, 0, 0, 1, 0, 0);
    drawImg(fctx, B);
    fctx.globalCompositeOperation = 'destination-in'; fctx.drawImage(mask, 0, 0, front.width, front.height);
    xctx.setTransform(1, 0, 0, 1, 0, 0); xctx.globalCompositeOperation = 'source-over'; xctx.clearRect(0, 0, scratch.width, scratch.height);
    drawImg(xctx, F);
    xctx.globalCompositeOperation = 'destination-out'; xctx.drawImage(mask, 0, 0, scratch.width, scratch.height);
    fctx.globalCompositeOperation = 'source-over'; fctx.drawImage(scratch, 0, 0);
    dirty = true;
  }
  var ANCH = [[.53, .66, -2.2], [.78, .66, -.8], [.45, .80, -2.8], [.9, .80, -.35], [.56, .72, -2.0], [.75, .72, -1.1]];
  function fx() {
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0); sctx.globalCompositeOperation = 'source-over'; sctx.clearRect(0, 0, W, H);
    if (!reduce && Math.random() < .2) {
      var A = ANCH[(Math.random() * ANCH.length) | 0];
      bolt(cover.x + A[0] * cover.w, cover.y + A[1] * cover.h, A[2] + (Math.random() - .5) * .9, cover.w * (.02 + Math.random() * .035), 5);
    }
    sctx.globalCompositeOperation = 'lighter'; sctx.lineCap = 'round';
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.vx *= .94; p.vy = p.vy * .94 + .05; p.x += p.vx; p.y += p.vy; p.life -= p.d;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      var tx = p.x - p.vx * 3, ty = p.y - p.vy * 3;
      sctx.strokeStyle = 'hsla(' + p.hue + ',100%,62%,' + (p.life * .35).toFixed(3) + ')'; sctx.lineWidth = 5;   // soft glow
      sctx.beginPath(); sctx.moveTo(p.x, p.y); sctx.lineTo(tx, ty); sctx.stroke();
      sctx.strokeStyle = 'hsla(' + p.hue + ',100%,82%,' + p.life.toFixed(3) + ')'; sctx.lineWidth = 2;     // hot core
      sctx.beginPath(); sctx.moveTo(p.x, p.y); sctx.lineTo(tx, ty); sctx.stroke();
    }
    sctx.shadowColor = 'rgba(94,248,197,1)'; sctx.shadowBlur = 16; sctx.lineWidth = 2;
    for (i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i]; b.life -= .09; if (b.life <= 0) { bolts.splice(i, 1); continue; }
      sctx.strokeStyle = 'rgba(200,255,235,' + b.life.toFixed(3) + ')';
      sctx.beginPath(); sctx.moveTo(b.p[0][0], b.p[0][1]); for (var k = 1; k < b.p.length; k++) sctx.lineTo(b.p[k][0], b.p[k][1]); sctx.stroke();
    }
    sctx.shadowBlur = 0;
  }
  function frame(now) {
    raf = 0; if (!running || dead) return;
    if (pts.length || dirty) compose(now);
    fx();
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (running && !dead && !raf && visible) raf = requestAnimationFrame(frame); }
  function setRun(v) { running = v; if (v) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  // ---- menu overlay ----
  var menu = document.getElementById('rv-menu'), mbtn = hero.querySelector('.rv-menu-btn');
  function openMenu(o) { menu.classList.toggle('open', o); menu.setAttribute('aria-hidden', o ? 'false' : 'true'); mbtn.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) menu.querySelector('a,button').focus(); else mbtn.focus({preventScroll: true}); }
  mbtn.addEventListener('click', function () { openMenu(true); });
  menu.querySelector('.rv-menu-close').addEventListener('click', function () { openMenu(false); });
  menu.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) { if (a.getAttribute('href') === '#') e.preventDefault(); openMenu(false); } });
  on(document, 'keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) openMenu(false); });
  hero.querySelectorAll('a[href="#"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

  // ---- site header after the hero ----
  var body = document.body;
  function onScroll() { body.classList.toggle('hdr-show', window.scrollY > hero.offsetHeight - 70); }
  on(window, 'scroll', onScroll, {passive: true}); onScroll();

  // ---- boot ----
  var fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve();
  Promise.all([load('assets/hero/front' + ext + V), load('assets/hero/back' + ext + V), fontsReady]).then(function (r) {
    IMG.front = r[0]; IMG.back = r[1];
    if (dead) return;
    if (!IMG.front || !IMG.back) { hero.classList.add('ready'); return; }
    layout(); hero.classList.add('ready');
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { layout(); kick(); }); ro.observe(hero); offs.push(function () { ro.disconnect(); }); }
    else on(window, 'resize', function () { layout(); kick(); });
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRun(visible && !document.hidden); }); io.observe(hero); offs.push(function () { io.disconnect(); }); }
    on(document, 'visibilitychange', function () { setRun(visible && !document.hidden); });
    setRun(true);
  });

  function destroy() {
    if (dead) return; dead = true; setRun(false);
    offs.forEach(function (f) { f(); }); offs = [];
    pts = []; parts = []; bolts = []; body.classList.remove('hdr-show'); hero.__rv = 0;
    window.__rvActive = 0;
  }
  window.__rvActive = 1; /* debug/QA flag: 1 while a hero instance is alive */
  if (window.Site && Site.onLeave) Site.onLeave(destroy);
})();
