/* Hero animation: one continuous transformation — particles stream off the head
   and progressively link up into a neural network toward the right. No libraries. */
(function () {
  var art = document.querySelector('.hero-art');
  if (!art || !window.matchMedia) return;
  var mqDesk = matchMedia('(min-width:901px)'), mqRM = matchMedia('(prefers-reduced-motion: reduce)');
  var cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
  art.appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, hx = 0, span = 1, img = {w: 0, h: 0, y: 0};
  var NA = 0, abx, aby, ax_, ay_, aph;                          // soft anchors
  var N = 0, px, py, vx, vy, age, life, anc, gr, tt;            // particles
  var CELL = 72, gcols = 0, grows = 0, head, next;              // spatial grid
  var links = new Int32Array(0), nl = 0, sig = [];
  var running = false, visible = true, raf = 0, last = 0, T = 0, slow = 0;
  var B = 6;                                                     // t buckets

  function R(a, b) { return a + Math.random() * (b - a); }
  function ss(a, b, x) { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

  function layout() {
    var r = art.getBoundingClientRect();
    W = r.width; H = r.height;
    var dpr = Math.min(window.devicePixelRatio || 1, W > 1500 ? 1.5 : 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var iw = Math.max(W, H * 16 / 9), ih = iw * 9 / 16;
    img = {w: iw, h: ih, y: (H - ih) / 2};
    hx = iw * 0.585; span = Math.max(1, W - hx);
    art.style.setProperty('--hx', Math.round(iw * 0.60) + 'px');
    // soft anchors, density rising toward the right, organic envelope
    NA = Math.round(Math.max(30, span / 9));
    abx = new Float32Array(NA); aby = new Float32Array(NA); ax_ = new Float32Array(NA); ay_ = new Float32Array(NA); aph = new Float32Array(NA);
    for (var i = 0; i < NA; i++) {
      var t = .12 + .88 * Math.sqrt(Math.random());
      var env = .22 + .2 * Math.sin(Math.min(1, t) * Math.PI * .9);
      var g = (Math.random() + Math.random() + Math.random()) / 1.5 - 1;
      abx[i] = hx + span * t - 20; aby[i] = H * .47 + g * H * env * 1.4; aph[i] = R(0, 6.283);
    }
    gcols = Math.ceil(W / CELL) + 1; grows = Math.ceil(H / CELL) + 1;
    head = new Int32Array(gcols * grows);
    alloc(Math.round(Math.min(W > 1500 ? 700 : W > 1350 ? 850 : 1000, W * H / 700)));
  }

  function alloc(n) {
    N = n; next = new Int32Array(N); links = new Int32Array(N * 6);
    px = new Float32Array(N); py = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
    age = new Float32Array(N); life = new Float32Array(N); anc = new Int16Array(N); gr = new Uint8Array(N); tt = new Float32Array(N);
    for (var i = 0; i < N; i++) { spawn(i); var s = (Math.random() * 900) | 0; for (var k = 0; k < s; k++) step(i, 1 / 60, k / 60); }
    sig = [];
  }
  function spawn(i) {
    var q = Math.random();
    px[i] = hx - img.w * .03 + Math.sin(q * Math.PI) * img.w * .05 + R(-6, 10);
    py[i] = img.y + img.h * (.08 + .66 * q) + R(-5, 5);
    vx[i] = R(30, 60); vy[i] = R(-10, 10);
    age[i] = 0; life[i] = R(5, 12); anc[i] = (Math.random() * NA) | 0; gr[i] = Math.random() < .12 ? 1 : 0;
  }

  function step(i, dt, t0) {
    var x = px[i], y = py[i], t = (x - hx) / span; tt[i] = t;
    var fx = Math.sin(y * .011 + t0 * .6) + Math.cos(x * .007 - t0 * .4) * .6;
    var fy = Math.cos(x * .009 + t0 * .5) + Math.sin(y * .013 - t0 * .7) * .6;
    var slowk = 1 - .7 * ss(.05, 1, t);                          // continuous slow-down
    var spread = .6 + 1.2 * Math.sin(Math.PI * Math.min(1, Math.max(0, t) / .8)) * (1 - ss(.5, 1, t));
    var tx = (70 + fx * 18) * slowk, ty = fy * 24 * spread * (0.6 + slowk);
    var a = anc[i], k = ss(.15, 1, t) * 2.2;                     // anchor pull ramps in
    if (k > 0) { tx += (ax_[a] - x) * k; ty += (ay_[a] - y) * k; }
    var damp = Math.min(1, dt * 2.2);
    vx[i] += (tx - vx[i]) * damp; vy[i] += (ty - vy[i]) * damp;
    px[i] = x + vx[i] * dt; py[i] = y + vy[i] * dt; age[i] += dt;
    if (k > .5 && Math.random() < dt * .25) anc[i] = (Math.random() * NA) | 0;   // wander between anchors
    if (age[i] > life[i] || px[i] > W + 8 || py[i] < -30 || py[i] > H + 30) spawn(i);
  }

  var cols = [], P = [], L = [];
  for (var b = 0; b < B; b++) {
    var u = b / (B - 1);
    cols.push('rgba(' + Math.round(244 - 90 * u * .35) + ',' + Math.round(247 - 25 * u * .35) + ',' + Math.round(246 - 50 * u * .35) + ',' + (.95 - .25 * Math.sin(u * Math.PI)).toFixed(2) + ')');
  }

  function frame(now) {
    raf = 0; if (!running) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; T += dt;
    if (dt > .0185) { if (++slow > 40 && N > 300) { alloc((N * .8) | 0); slow = 0; } } else slow = Math.max(0, slow - 1);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    for (var a = 0; a < NA; a++) { ax_[a] = abx[a] + Math.sin(T * .35 + aph[a]) * 14; ay_[a] = aby[a] + Math.cos(T * .3 + aph[a] * 1.7) * 12; }
    head.fill(-1);
    var i, j;
    for (i = 0; i < N; i++) {
      step(i, dt, T);
      var c = ((px[i] / CELL) | 0) + ((py[i] / CELL) | 0) * gcols;
      if (c >= 0 && c < head.length) { next[i] = head[c]; head[c] = i; } else next[i] = -1;
    }
    // links between nearby particles; radius & alpha ramp with t
    var LB = 4, lp = []; for (b = 0; b < LB; b++) lp.push(new Path2D());
    nl = 0;
    for (i = 0; i < N; i++) {
      var ti = tt[i]; if (ti < .04) continue;
      var rr = 10 + 58 * ss(.04, 1, ti), r2 = rr * rr, cnt = 0;
      var gx = (px[i] / CELL) | 0, gy = (py[i] / CELL) | 0;
      for (var oy = -1; oy <= 1 && cnt < 3; oy++) for (var ox = -1; ox <= 1 && cnt < 3; ox++) {
        var cx = gx + ox, cy = gy + oy; if (cx < 0 || cy < 0 || cx >= gcols || cy >= grows) continue;
        for (j = head[cx + cy * gcols]; j !== -1 && cnt < 3; j = next[j]) {
          if (j <= i) continue;
          var dx = px[j] - px[i], dy = py[j] - py[i], d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          var s = ss(.04, 1, Math.min(ti, tt[j])) * (1 - d2 / r2) * fade(i) * fade(j);
          if (s < .03) continue;
          var bk = Math.min(LB - 1, (s * LB) | 0);
          lp[bk].moveTo(px[i], py[i]); lp[bk].lineTo(px[j], py[j]); cnt++;
          if (s > .35 && nl < links.length / 2) { links[nl * 2] = i; links[nl * 2 + 1] = j; nl++; }
        }
      }
    }
    ctx.lineWidth = .6;
    for (b = 0; b < LB; b++) { ctx.strokeStyle = 'rgba(214,224,220,' + (.12 + .38 * (b + .5) / LB).toFixed(3) + ')'; ctx.stroke(lp[b]); }
    // particles in t buckets (size & colour ramp)
    var pp = [], pg = new Path2D(), pgh = new Path2D();
    for (b = 0; b < B; b++) pp.push(new Path2D());
    for (i = 0; i < N; i++) {
      var t = Math.max(0, Math.min(1, tt[i])), f = fade(i); if (f < .15) continue;
      var sz = (1 + 1.4 * ss(.4, 1, t)) * (.6 + .4 * f);
      if (gr[i] && t > .2) {
        var gs = sz * (.6 + .9 * ss(.2, 1, t));
        pg.moveTo(px[i] + gs, py[i]); pg.arc(px[i], py[i], gs, 0, 6.283);
        if (t > .55) { pgh.moveTo(px[i] + gs * 3.5, py[i]); pgh.arc(px[i], py[i], gs * 3.5, 0, 6.283); }
      } else pp[Math.min(B - 1, (t * B) | 0)].rect(px[i] - sz / 2, py[i] - sz / 2, sz, sz);
    }
    for (b = 0; b < B; b++) { ctx.fillStyle = cols[b]; ctx.fill(pp[b]); }
    ctx.fillStyle = 'rgba(150,224,192,.08)'; ctx.fill(pgh);
    ctx.fillStyle = 'rgba(160,226,196,.9)'; ctx.fill(pg);
    // signals hopping along dynamic links
    if (nl && sig.length < 36 && Math.random() < dt * 16) { var q = (Math.random() * nl) | 0; sig.push({a: links[q * 2], b: links[q * 2 + 1], u: 0, v: R(1.2, 2.2)}); }
    var ps = new Path2D();
    for (var k = sig.length - 1; k >= 0; k--) {
      var g = sig[k]; g.u += dt * g.v;
      var ddx = px[g.b] - px[g.a], ddy = py[g.b] - py[g.a];
      if (g.u >= 1 || ddx * ddx + ddy * ddy > 9000) { sig.splice(k, 1); continue; }
      var sx = px[g.a] + ddx * g.u, sy = py[g.a] + ddy * g.u;
      ps.moveTo(sx + 1.5, sy); ps.arc(sx, sy, 1.5, 0, 6.283);
    }
    ctx.fillStyle = 'rgba(160,232,200,.95)'; ctx.fill(ps);
    raf = requestAnimationFrame(frame);
  }
  function fade(i) { // smooth in at emission, out at end of life / far right edge
    return Math.min(1, age[i] / .35) * Math.min(1, (life[i] - age[i]) / 1.5) * Math.min(1, (W - px[i]) / 40);
  }

  function update() {
    var on = mqDesk.matches && !mqRM.matches;
    cv.style.display = on ? '' : 'none'; art.classList.toggle('anim-on', on);
    var should = on && visible && !document.hidden;
    if (should && !running) { running = true; last = 0; if (!raf) raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (mqDesk.matches) layout(); update(); }, 150); });
  document.addEventListener('visibilitychange', update);
  (mqDesk.addEventListener ? mqDesk.addEventListener('change', update) : mqDesk.addListener(update));
  (mqRM.addEventListener ? mqRM.addEventListener('change', update) : mqRM.addListener(update));
  if ('IntersectionObserver' in window)
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; update(); }).observe(art);
  if (mqDesk.matches) layout();
  update();
})();
