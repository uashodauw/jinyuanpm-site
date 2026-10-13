/* Hero animation: head -> scattered particles -> neural network. No libraries. */
(function () {
  var art = document.querySelector('.hero-art');
  if (!art || !window.matchMedia) return;
  var mqDesk = matchMedia('(min-width:901px)'), mqRM = matchMedia('(prefers-reduced-motion: reduce)');
  var cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
  art.appendChild(cv);
  var ctx = cv.getContext('2d'), W = 0, H = 0, img = {x: 0, y: 0, w: 0, h: 0};
  var nodes = [], edges = [], parts = [], sigs = [], running = false, visible = true, raf = 0, last = 0;
  var CYCLE = 9000; // ms per particle life
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function layout() {
    var r = art.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // image drawn with object-fit:cover, object-position:left center (16:9)
    var iw = Math.max(W, H * 16 / 9), ih = iw * 9 / 16;
    img = {x: 0, y: (H - ih) / 2, w: iw, h: ih};
    // network: layered columns from behind the head to the right edge
    nodes = []; edges = [];
    var x0 = img.x + img.w * 0.74, x1 = W - 24, L = Math.max(3, Math.min(6, Math.round((x1 - x0) / 80)));
    if (x1 - x0 < 120) { x0 = W * 0.72; L = 3; }
    var counts = [4, 6, 7, 6, 5, 3], cols = [];
    for (var l = 0; l < L; l++) {
      var n = counts[Math.round(l * (counts.length - 1) / Math.max(1, L - 1))], col = [];
      var x = x0 + (x1 - x0) * (L === 1 ? 0 : l / (L - 1));
      for (var i = 0; i < n; i++) {
        var y = H * 0.16 + (H * 0.62) * ((i + .5) / n) + rnd(-8, 8);
        var nd = {x: x + rnd(-10, 10), y: y, on: 0, glow: Math.random() < .14, ph: rnd(0, 6.28)};
        nodes.push(nd); col.push(nd);
      }
      cols.push(col);
    }
    for (l = 0; l < cols.length - 1; l++)
      cols[l].forEach(function (a) {
        cols[l + 1].forEach(function (b) {
          if (Math.abs(a.y - b.y) < H * 0.32 && Math.random() < .7) edges.push({a: a, b: b});
        });
      });
    // particles: ~45% assigned to nodes, rest are dust
    parts = [];
    var N = Math.min(240, Math.round(W * H / 2000));
    for (i = 0; i < N; i++) parts.push(spawn({}, Math.random() * CYCLE, i < nodes.length * 3 ? nodes[i % nodes.length] : null));
  }

  function spawn(p, age, target) {
    // emit from the back of the head (dissolving wireframe region)
    p.sx = img.x + img.w * rnd(0.56, 0.74); p.sy = img.y + img.h * rnd(0.14, 0.62);
    p.mx = p.sx + rnd(60, 220); p.my = p.sy + rnd(-70, 70); // scattered drift point
    p.t = target; p.age = age; p.life = CYCLE * rnd(.85, 1.15);
    if (!target) { p.tx = p.mx + rnd(80, W); p.ty = p.my + rnd(-40, 40); }
    p.r = target ? rnd(1.6, 2.4) : rnd(.8, 1.6);
    return p;
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min(50, now - (last || now)); last = now;
    ctx.clearRect(0, 0, W, H);
    nodes.forEach(function (n) { n.on *= 0.992; });
    var ts = now / 1000;
    // particles
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i]; p.age += dt;
      if (p.age > p.life) spawn(p, 0, p.t);
      var u = p.age / p.life, x, y, a;
      var tx = p.t ? p.t.x : p.tx, ty = p.t ? p.t.y : p.ty;
      if (u < .35) { // head -> scattered
        var k = ease(u / .35);
        x = p.sx + (p.mx - p.sx) * k + Math.sin(ts * 1.3 + i) * 4 * k;
        y = p.sy + (p.my - p.sy) * k + Math.cos(ts + i) * 4 * k;
        a = Math.min(1, u / .08) * .7;
      } else if (u < .7) { // scattered -> network
        var k2 = ease((u - .35) / .35);
        x = p.mx + (tx - p.mx) * k2 + Math.sin(ts * 1.3 + i) * 4 * (1 - k2);
        y = p.my + (ty - p.my) * k2 + Math.cos(ts + i) * 4 * (1 - k2);
        a = .7;
      } else { // settled; fade near end
        x = tx; y = ty; a = .7 * Math.min(1, (1 - u) / .12);
        if (p.t) p.t.on = Math.max(p.t.on, Math.min(1, (u - .7) / .08) * Math.min(1, (1 - u) / .12));
      }
      if (!p.t && u >= .7) continue;
      ctx.fillStyle = 'rgba(225,230,228,' + (a * .85).toFixed(3) + ')';
      ctx.fillRect(x - p.r / 2, y - p.r / 2, p.r, p.r);
    }
    // edges
    ctx.lineWidth = .8;
    edges.forEach(function (e) {
      var o = Math.min(e.a.on, e.b.on);
      if (o < .02) return;
      ctx.strokeStyle = 'rgba(210,215,214,' + (o * .55).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
      if (o > .6 && Math.random() < dt / 2600) sigs.push({e: e, u: 0});
    });
    // signals
    for (i = sigs.length - 1; i >= 0; i--) {
      var s = sigs[i]; s.u += dt / 900;
      var o2 = Math.min(s.e.a.on, s.e.b.on);
      if (s.u > 1 || o2 < .1) { sigs.splice(i, 1); continue; }
      var sx = s.e.a.x + (s.e.b.x - s.e.a.x) * s.u, sy = s.e.a.y + (s.e.b.y - s.e.a.y) * s.u;
      ctx.fillStyle = 'rgba(150,222,190,' + (.8 * o2).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 1.4, 0, 6.283); ctx.fill();
    }
    // nodes with soft pulse
    nodes.forEach(function (n) {
      if (n.on < .02) return;
      var pulse = .75 + .25 * Math.sin(ts * 2 + n.ph), r = (n.glow ? 2.8 : 2.2) * pulse;
      if (n.glow) {
        ctx.fillStyle = 'rgba(150,222,190,' + (.16 * n.on).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 4, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(150,222,190,' + (.9 * n.on).toFixed(3) + ')';
      } else ctx.fillStyle = 'rgba(230,234,232,' + (.85 * n.on).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
    });
    raf = requestAnimationFrame(frame);
  }

  function update() {
    var should = mqDesk.matches && !mqRM.matches && visible && !document.hidden;
    cv.style.display = mqDesk.matches && !mqRM.matches ? '' : 'none';
    if (should && !running) { running = true; last = 0; if (!raf) raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); update(); }, 150); });
  document.addEventListener('visibilitychange', update);
  (mqDesk.addEventListener ? mqDesk.addEventListener('change', update) : mqDesk.addListener(update));
  (mqRM.addEventListener ? mqRM.addEventListener('change', update) : mqRM.addListener(update));
  if ('IntersectionObserver' in window)
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; update(); }).observe(art);
  layout(); update();
})();
