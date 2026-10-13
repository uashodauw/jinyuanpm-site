/* Hero animation: dense stream off the head -> sparse drift -> dense neural network. No libraries. */
(function () {
  var art = document.querySelector('.hero-art');
  if (!art || !window.matchMedia) return;
  var mqDesk = matchMedia('(min-width:901px)'), mqRM = matchMedia('(prefers-reduced-motion: reduce)');
  var cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
  art.appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1, hx = 0, netL = 0, img = {w: 0, h: 0, y: 0};
  var NN = 0, nbx, nby, nx, ny, nph, nglow, non;          // nodes
  var E = [], sig = [];                                       // edges, signals
  var N = 0, px, py, vx, vy, age, life, tgt, st;             // particles
  var running = false, visible = true, raf = 0, last = 0, T = 0, slow = 0;

  function R(a, b) { return a + Math.random() * (b - a); }

  function layout() {
    var r = art.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, W > 1500 ? 1.5 : 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var iw = Math.max(W, H * 16 / 9), ih = iw * 9 / 16;
    img = {w: iw, h: ih, y: (H - ih) / 2};
    hx = iw * 0.585;                                   // back of the skull
    art.style.setProperty('--hx', Math.round(iw * 0.60) + 'px');
    netL = hx + (W - hx) * 0.30;                       // network region starts here
    // nodes: jittered layered grid filling the right side
    var cols = Math.max(5, Math.round((W - 30 - netL) / 46)), rows = 11, list = [];
    for (var c = 0; c < cols; c++) for (var k = 0; k < rows; k++) {
      if (Math.random() < .18) continue;
      var t = c / (cols - 1), spread = .6 + .3 * Math.sin(t * Math.PI); // bulge in middle of net
      list.push([netL + (W - 30 - netL) * t + R(-12, 12), H * (.5 + (k / (rows - 1) - .5) * spread * 1.15) + R(-14, 14)]);
    }
    NN = list.length;
    nbx = new Float32Array(NN); nby = new Float32Array(NN); nx = new Float32Array(NN); ny = new Float32Array(NN);
    nph = new Float32Array(NN); nglow = new Uint8Array(NN); non = new Float32Array(NN);
    for (var i = 0; i < NN; i++) { nbx[i] = nx[i] = list[i][0]; nby[i] = ny[i] = list[i][1]; nph[i] = R(0, 6.283); nglow[i] = Math.random() < .1 ? 1 : 0; non[i] = .4; }
    // edges: 3 nearest neighbours, forward-leaning
    E = []; var seen = {};
    for (i = 0; i < NN; i++) {
      var d = [];
      for (var j = 0; j < NN; j++) if (j !== i) { var dx = nbx[j] - nbx[i], dy = nby[j] - nby[i]; d.push([dx * dx + dy * dy * 1.4, j]); }
      d.sort(function (a, b) { return a[0] - b[0]; });
      for (k = 0; k < 3 && k < d.length; k++) { var a = Math.min(i, d[k][1]), b = Math.max(i, d[k][1]); if (!seen[a + '_' + b]) { seen[a + '_' + b] = 1; E.push(a, b); } }
    }
    sig = [];
    alloc(Math.round(Math.min(1100, W * H / 650)));
  }

  function alloc(n) {
    N = n;
    px = new Float32Array(N); py = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
    age = new Float32Array(N); life = new Float32Array(N); tgt = new Int16Array(N); st = new Float32Array(N);
    for (var i = 0; i < N; i++) { spawn(i); pre(i); }
  }
  function spawn(i) {
    var q = Math.random();                                    // position along the back of the head
    var y = img.y + img.h * (.08 + .66 * q);
    var bulge = Math.sin(q * Math.PI) * img.w * .05;          // skull curvature
    px[i] = hx - img.w * .03 + bulge + R(-6, 10); py[i] = y + R(-5, 5);
    vx[i] = R(20, 50); vy[i] = R(-10, 10);
    age[i] = 0; life[i] = R(6, 10); tgt[i] = (Math.random() * NN) | 0; st[i] = R(.6, 1.4);
  }
  function pre(i) { // warm start: spread existing particles along their journey
    var steps = (Math.random() * 400) | 0;
    for (var s = 0; s < steps; s++) step(i, 1 / 60, T + s / 60);
  }

  function step(i, dt, t) {
    var x = px[i], y = py[i];
    // flow field (smooth pseudo curl noise)
    var fx = Math.sin(y * .011 + t * .6) + Math.cos(x * .007 - t * .4) * .6;
    var fy = Math.cos(x * .009 + t * .5) + Math.sin(y * .013 - t * .7) * .6;
    var ax = 34 + fx * 22, ay = fy * 26;
    // dispersion in the middle, attraction on the right
    var prog = (x - hx) / Math.max(1, netL - hx);             // 0 at head, 1 at network
    var j = tgt[i];
    if (prog > .55) {
      var k = Math.min(1, (prog - .55) / .6) * 5.5;
      var dx = nx[j] - x, dy = ny[j] - y;
      ax += dx * k * .35; ay += dy * k * .35;
      if (dx * dx + dy * dy < 90) { non[j] = Math.min(1, non[j] + .04); if (Math.random() < .02) tgt[i] = nearNext(j); }
    }
    vx[i] += (ax - vx[i]) * Math.min(1, dt * 1.8 * st[i]);
    vy[i] += (ay - vy[i]) * Math.min(1, dt * 1.8 * st[i]);
    px[i] = x + vx[i] * dt; py[i] = y + vy[i] * dt;
    age[i] += dt;
    if (age[i] > life[i] || px[i] > W + 10 || py[i] < -20 || py[i] > H + 20) spawn(i);
  }
  function nearNext(j) { // hop along an edge to keep the network flowing rightward
    for (var e = 0; e < E.length; e += 2) if (E[e] === j && nbx[E[e + 1]] > nbx[j] && Math.random() < .5) return E[e + 1];
    return (Math.random() * NN) | 0;
  }

  function frame(now) {
    raf = 0; if (!running) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; T += dt;
    // adaptive budget
    if (dt > .0185) { if (++slow > 40 && N > 400) { alloc((N * .75) | 0); slow = 0; } } else slow = Math.max(0, slow - 1);
    // fade previous frame -> short trails (keeps canvas transparent)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // breathing network
    for (var n = 0; n < NN; n++) {
      nx[n] = nbx[n] + Math.sin(T * .7 + nph[n]) * 5; ny[n] = nby[n] + Math.cos(T * .6 + nph[n] * 1.3) * 4;
      non[n] += (.45 - non[n]) * dt * .8;
    }
    // particles (batched, two brightness buckets)
    var pA = new Path2D(), pB = new Path2D();
    for (var i = 0; i < N; i++) {
      step(i, dt, T);
      var x = px[i], y = py[i], f = Math.min(1, age[i] * 3) * Math.min(1, (life[i] - age[i]) * 2);
      var near = (x - hx) < 70 || x > netL;
      var s = near ? 1.1 : 1.4;
      (near && f > .6 ? pA : pB).rect(x, y, s, s);
    }
    ctx.fillStyle = 'rgba(244,247,246,.9)'; ctx.fill(pA);
    ctx.fillStyle = 'rgba(220,226,224,.5)'; ctx.fill(pB);
    // edges: one path, plus a brighter pass for active ones
    var pe = new Path2D(), ph = new Path2D();
    for (var e = 0; e < E.length; e += 2) {
      var a = E[e], b = E[e + 1];
      var p = (non[a] + non[b]) > 1.3 ? ph : pe;
      p.moveTo(nx[a], ny[a]); p.lineTo(nx[b], ny[b]);
    }
    ctx.lineWidth = .6; ctx.strokeStyle = 'rgba(210,218,216,.32)'; ctx.stroke(pe);
    ctx.strokeStyle = 'rgba(230,236,234,.5)'; ctx.stroke(ph);
    // signals
    if (sig.length < 40 && Math.random() < dt * 14) sig.push({e: ((Math.random() * E.length / 2) | 0) * 2, u: 0, v: R(.8, 1.6)});
    ctx.fillStyle = 'rgba(150,224,192,.95)';
    var ps = new Path2D();
    for (i = sig.length - 1; i >= 0; i--) {
      var g = sig[i]; g.u += dt * g.v;
      if (g.u >= 1) { var nb = nearNext(E[g.e + 1]); g.u = 0; g.e = edgeFrom(E[g.e + 1], nb); if (g.e < 0 || Math.random() < .3) { sig.splice(i, 1); continue; } }
      var a2 = E[g.e], b2 = E[g.e + 1];
      var sx = nx[a2] + (nx[b2] - nx[a2]) * g.u, sy = ny[a2] + (ny[b2] - ny[a2]) * g.u;
      ps.moveTo(sx + 1.6, sy); ps.arc(sx, sy, 1.6, 0, 6.283);
    }
    ctx.fill(ps);
    // nodes
    var pn = new Path2D(), pg = new Path2D(), pgh = new Path2D();
    for (n = 0; n < NN; n++) {
      var r = (1.4 + non[n] * 1.4) * (.85 + .15 * Math.sin(T * 2.2 + nph[n]));
      if (nglow[n]) { pg.moveTo(nx[n] + r + .6, ny[n]); pg.arc(nx[n], ny[n], r + .6, 0, 6.283); pgh.moveTo(nx[n] + r * 4, ny[n]); pgh.arc(nx[n], ny[n], r * 4, 0, 6.283); }
      else { pn.moveTo(nx[n] + r, ny[n]); pn.arc(nx[n], ny[n], r, 0, 6.283); }
    }
    ctx.fillStyle = 'rgba(150,224,192,.10)'; ctx.fill(pgh);
    ctx.fillStyle = 'rgba(150,224,192,.95)'; ctx.fill(pg);
    ctx.fillStyle = 'rgba(238,242,240,.85)'; ctx.fill(pn);
    raf = requestAnimationFrame(frame);
  }
  function edgeFrom(a, b) { for (var e = 0; e < E.length; e += 2) if ((E[e] === a && E[e + 1] === b)) return e; return -1; }

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
