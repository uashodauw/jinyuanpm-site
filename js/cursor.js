/* JINYUAN — custom HUD cursor (fine pointers only).
   A mint dot tracks the pointer exactly; a bracket reticle eases after it, snaps around interactive
   elements, pulses on click and becomes a brush-size ring over the hero reveal canvas.
   Persistent across router navigations (#rt-cursor is kept by js/router.js); hover targets are found
   by delegation, so nothing needs rebinding. Transform/opacity only; the rAF loop sleeps when idle. */
(function () {
  if (window.__cc) return; window.__cc = 1;
  var doc = document, root = doc.documentElement;
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)'), mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var HOVER = 'a[href],button,summary,label[for],select,[role="button"],.chip,.rv-card,.project,.acard,.nav-links a,.rv-nav a';
  var TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]):not([type="color"]),textarea,[contenteditable="true"]';
  var el, dot, ring, circ, brush, bScale = 0, tB = 0, cs = [], on = false, raf = 0;
  var mx = -100, my = -100, rx = -100, ry = -100;           /* pointer / reticle centre */
  var hw = 15, hh = 15, tw = 15, th = 15;                   /* reticle half-size (current / target) */
  var cScale = 1, tScale = 1, cAlpha = 1, tAlpha = 1;       /* inner circle scale/opacity */
  var mode = 'idle', target = null, visible = false, down = false;

  function build() {
    el = doc.createElement('div'); el.id = 'rt-cursor'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="cc-ring"><i class="cc-circ"></i><i class="cc-brush"></i><b></b><b></b><b></b><b></b></div><div class="cc-dot"></div>';
    doc.body.appendChild(el);
    ring = el.firstChild; dot = el.lastChild; circ = ring.firstChild; brush = circ.nextSibling; cs = [].slice.call(ring.querySelectorAll('b'));
  }
  function wake() { if (!raf && on) raf = requestAnimationFrame(tick); }

  function classify(t) {
    if (!t || !t.closest) return ['idle', null];
    if (t.closest(TEXT)) return ['text', null];
    var h = t.closest(HOVER);
    if (h) { var c = h.closest('.project,.rv-card,.acard'); if (c && h.matches('.card-link')) h = c; return ['hover', h]; }
    if (t.closest('#hero') && !t.closest('.rv-header,.rv-card,.rv-menu,.rv-copy a') && doc.body.classList.contains('home-reveal')) return ['brush', null];
    return ['idle', null];
  }
  function setMode(m, t) {
    mode = m; target = t;
    el.classList.toggle('is-hover', m === 'hover'); el.classList.toggle('is-brush', m === 'brush'); el.classList.toggle('is-text', m === 'text');
    wake();
  }
  function goals() {
    if (mode === 'hover' && target && target.isConnected) {
      var r = target.getBoundingClientRect(), pad = r.width > 260 || r.height > 160 ? 4 : 7;
      var big = r.width > 260 || r.height > 160;
      tw = Math.min(r.width / 2 + pad, 900); th = Math.min(r.height / 2 + pad, 600);
      /* small targets: snap the reticle onto the element; big cards: bracket the card */
      var gx = r.left + r.width / 2, gy = r.top + r.height / 2;
      tScale = 0; tAlpha = 0;
      return [gx + (mx - gx) * (big ? 0 : .12), gy + (my - gy) * (big ? 0 : .12)];
    }
    if (mode === 'hover') setMode('idle', null);
    if (mode === 'brush') {
      var hero = doc.getElementById('hero'), b = hero ? +hero.getAttribute('data-brush') || 40 : 40;
      tw = th = b * .72; tScale = 0; tAlpha = 0; tB = b / 100;
    } else if (mode === 'text') { tw = th = 9; tScale = .4; tAlpha = 0; }
    else { tw = th = 15; tScale = 1; tAlpha = 1; }
    return [mx, my];
  }
  function tick() {
    raf = 0; if (!on) return;
    var g = goals(), k = mqReduce.matches ? 1 : .2, ks = mqReduce.matches ? 1 : .22;
    rx += (g[0] - rx) * k; ry += (g[1] - ry) * k;
    hw += (tw - hw) * ks; hh += (th - hh) * ks; cScale += (tScale - cScale) * ks; cAlpha += (tAlpha - cAlpha) * ks;
    if (mode !== 'brush') tB = .3;
    bScale += (tB - bScale) * ks;
    brush.style.transform = 'scale(' + bScale.toFixed(3) + ')';
    var press = down ? .86 : 1;
    dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)' + (down ? ' scale(.6)' : '');
    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) scale(' + press + ')';
    var w = hw, h = hh;
    cs[0].style.transform = 'translate3d(' + (-w) + 'px,' + (-h) + 'px,0)';
    cs[1].style.transform = 'translate3d(' + w + 'px,' + (-h) + 'px,0) rotate(90deg)';
    cs[2].style.transform = 'translate3d(' + w + 'px,' + h + 'px,0) rotate(180deg)';
    cs[3].style.transform = 'translate3d(' + (-w) + 'px,' + h + 'px,0) rotate(270deg)';
    circ.style.transform = 'scale(' + cScale.toFixed(3) + ')'; circ.style.opacity = cAlpha.toFixed(3);
    var moving = Math.abs(g[0] - rx) > .1 || Math.abs(g[1] - ry) > .1 || Math.abs(tw - hw) > .1 || Math.abs(th - hh) > .1 ||
      Math.abs(tScale - cScale) > .005 || Math.abs(tAlpha - cAlpha) > .005 || Math.abs(tB - bScale) > .003 || (mode === 'hover' && target);
    if (moving) raf = requestAnimationFrame(tick);
  }
  function show(v) { if (v === visible) return; visible = v; el.classList.toggle('is-on', v); }

  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') { show(false); return; }
    var first = !visible;
    mx = e.clientX; my = e.clientY;
    if (first) { rx = mx; ry = my; }
    show(true);
    var c = classify(e.target); if (c[0] !== mode || c[1] !== target) setMode(c[0], c[1]);
    wake();
  }
  function onDown(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    down = true; wake();
    if (mqReduce.matches) return;
    var p = doc.createElement('i'); p.className = 'cc-pulse'; el.appendChild(p);
    p.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    var a = p.animate([{ transform: 'translate3d(' + mx + 'px,' + my + 'px,0) scale(.3)', opacity: .9 },
      { transform: 'translate3d(' + mx + 'px,' + my + 'px,0) scale(2.4)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' });
    a.onfinish = a.oncancel = function () { p.remove(); };
  }
  function onUp() { down = false; wake(); }
  function onOut(e) { if (!e.relatedTarget) show(false); }
  function onScroll() { if (mode === 'hover') wake(); }

  function enable() {
    if (on) return; on = true;
    if (!el) build();
    root.classList.add('cc-on');
    doc.addEventListener('pointermove', onMove, { passive: true });
    doc.addEventListener('pointerdown', onDown, { passive: true });
    doc.addEventListener('pointerup', onUp, { passive: true });
    doc.addEventListener('mouseout', onOut);
    window.addEventListener('blur', onOut);
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  function disable() {
    if (!on) return; on = false;
    root.classList.remove('cc-on'); show(false);
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    doc.removeEventListener('pointermove', onMove); doc.removeEventListener('pointerdown', onDown);
    doc.removeEventListener('pointerup', onUp); doc.removeEventListener('mouseout', onOut);
    window.removeEventListener('blur', onOut); window.removeEventListener('scroll', onScroll);
  }
  function sync() { if (mqFine.matches) enable(); else disable(); }
  (mqFine.addEventListener ? mqFine.addEventListener('change', sync) : mqFine.addListener(sync));
  sync();
  /* after an in-place navigation the old target is gone: re-evaluate what is under the pointer */
  window.addEventListener('popstate', function () { setTimeout(recheck, 650); });
  doc.addEventListener('click', function () { setTimeout(recheck, 650); });
  function recheck() { if (!on || !visible) return; var t = doc.elementFromPoint(mx, my), c = classify(t); setMode(c[0], c[1]); }
})();
