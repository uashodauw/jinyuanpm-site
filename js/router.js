/* JINYUAN — lightweight client-side router.
   Same-origin .html links switch in place: the header/nav persists, the active pill slides,
   and the page content wipes in behind a mint scan line (blur + fade, ~560ms total).
   Every page is still a complete standalone HTML file; without JS (or on any error) links behave normally. */
(function () {
  var doc = document, body = doc.body, Site = window.Site;
  if (!Site || !window.fetch || !window.DOMParser || !history.pushState || !Element.prototype.animate) return;

  var header = doc.querySelector('.site-header');
  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)'), mqDesk = matchMedia('(min-width: 901px)');
  var cache = {}, seq = 0, busy = false, outAnim = null, inAnim = null, scanAnim = null;
  var EASE_IN = 'cubic-bezier(.4,0,1,1)', EASE_OUT = 'cubic-bezier(.2,.75,.25,1)';

  function persistent(n) {
    return n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'NOSCRIPT' || n.tagName === 'TEMPLATE' ||
      n.classList.contains('site-header') || n.classList.contains('skip') || n.classList.contains('guides') || /^rt-/.test(n.id);
  }

  /* ---- one-time scaffold: wrap the swappable part of <body> in #rt-view ---- */
  var view = doc.createElement('div'); view.id = 'rt-view';
  [].slice.call(body.childNodes).forEach(function (n) { if (!persistent(n)) view.appendChild(n); });
  var firstScript = body.querySelector(':scope > script');
  body.insertBefore(view, header ? header.nextSibling : firstScript);
  var scan = doc.createElement('div'); scan.id = 'rt-scan'; scan.setAttribute('aria-hidden', 'true'); body.appendChild(scan);
  var guides = body.querySelector(':scope > .guides');

  /* ---- sliding pill under the active nav item ---- */
  var nav = header && header.querySelector('nav'), ind = null;
  if (nav) { ind = doc.createElement('span'); ind.className = 'nav-ind'; ind.setAttribute('aria-hidden', 'true'); nav.appendChild(ind); header.classList.add('has-ind'); }
  function placeInd(animate) {
    if (!ind) return;
    var a = nav.querySelector('.nav-links a[aria-current]');
    if (!a || !mqDesk.matches) { ind.style.opacity = '0'; return; }
    var nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    if (!animate || ind.style.opacity !== '1') ind.style.transition = 'none';
    ind.style.width = r.width + 'px'; ind.style.height = r.height + 'px';
    ind.style.transform = 'translate(' + (r.left - nr.left) + 'px,' + (r.top - nr.top) + 'px)';
    ind.style.opacity = '1';
    if (ind.style.transition === 'none') { ind.offsetWidth; ind.style.transition = ''; }
  }
  placeInd(false);
  window.addEventListener('resize', function () { placeInd(false); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { placeInd(false); });

  /* ---- link eligibility + fetch cache / prefetch ---- */
  function key(u) { return u.pathname + u.search; }
  function eligible(a, e) {
    if (!a || !a.href || a.hasAttribute('download') || a.hasAttribute('data-no-router')) return null;
    if (a.target && a.target !== '_self') return null;
    if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return null;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return null; }
    if (u.origin !== location.origin) return null;
    if (!/(\.html|\/)$/.test(u.pathname)) return null;
    if (u.hash && key(u) === key(location)) return null;   /* same-page anchor: let the browser scroll */
    return u;
  }
  function load(u) {
    var k = key(u);
    if (!cache[k]) cache[k] = fetch(k, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok || (r.headers.get('content-type') || '').indexOf('html') < 0) throw new Error('bad');
      return r.text();
    }).catch(function (err) { delete cache[k]; throw err; });
    return cache[k];
  }
  function prefetch(e) { var u = eligible(e.target.closest && e.target.closest('a')); if (u && key(u) !== key(location)) load(u).catch(function () {}); }
  doc.addEventListener('pointerover', prefetch, { passive: true });
  doc.addEventListener('focusin', prefetch);
  doc.addEventListener('touchstart', prefetch, { passive: true });

  /* ---- helpers ---- */
  function stylesheetsReady(nd) {
    var have = {}, waits = [];
    [].forEach.call(doc.querySelectorAll('link[rel="stylesheet"]'), function (l) { have[l.getAttribute('href')] = 1; });
    [].forEach.call(nd.querySelectorAll('head link[rel="stylesheet"]'), function (l) {
      var h = l.getAttribute('href'); if (have[h]) return;
      var n = doc.createElement('link'); n.rel = 'stylesheet'; n.href = h;
      waits.push(new Promise(function (res) { n.onload = n.onerror = res; setTimeout(res, 2500); }));
      doc.head.appendChild(n);
    });
    return Promise.all(waits);
  }
  function runScripts(list) {
    return list.reduce(function (p, src) {
      return p.then(function () {
        return new Promise(function (res) {
          var s = doc.createElement('script'); s.src = src; s.async = false; s.setAttribute('data-rt', '');
          s.onload = s.onerror = function () { s.remove(); res(); };
          body.appendChild(s);
        });
      });
    }, Promise.resolve());
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function finishAnim(a) { if (a) { try { a.cancel(); } catch (x) {} } }

  /* ---- navigate ---- */
  function go(u, opts) {
    opts = opts || {};
    var my = ++seq, reduce = mqReduce.matches;
    history.scrollRestoration = 'manual';
    if (opts.push) history.replaceState({ rt: 1, y: window.scrollY }, '');
    Site.closeMenu();
    var rvm = doc.getElementById('rv-menu'); if (rvm && rvm.classList.contains('open')) { var cb = rvm.querySelector('.rv-menu-close'); if (cb) cb.click(); }
    busy = true; body.classList.add('rt-busy');
    finishAnim(inAnim); finishAnim(scanAnim);
    if (!outAnim) outAnim = view.animate(reduce
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' }, { opacity: 0, filter: 'blur(6px)', transform: 'translateY(-10px)' }],
      { duration: reduce ? 120 : 200, easing: EASE_IN, fill: 'forwards' });
    var parsed;
    return Promise.all([load(u), outAnim.finished.catch(function () {})]).then(function (r) {
      if (my !== seq) return;
      parsed = new DOMParser().parseFromString(r[0], 'text/html');
      return stylesheetsReady(parsed);
    }).then(function () {
      if (my !== seq) return;
      swap(parsed, u, opts);
      var scripts = [].slice.call(parsed.querySelectorAll('body script[src]')).map(function (s) { return s.getAttribute('src'); })
        .filter(function (s) { return !/js\/(main|router|cursor)\.js/.test(s); });
      Site.initPage();
      enter(reduce);
      return runScripts(scripts);
    }).then(function () {
      if (my !== seq) return;
      busy = false; body.classList.remove('rt-busy');
      if (u.hash) { var t = doc.getElementById(decodeURIComponent(u.hash.slice(1))); if (t) t.scrollIntoView(); }
    }).catch(function (err) { if (window.console) console.warn('[router] falling back to full load', err); location.href = u.href; });  /* anything unexpected: plain page load */
  }

  function swap(nd, u, opts) {
    Site.leave();                                   /* page teardown hooks (hero canvas, article listeners, observers) */
    var fromHome = body.classList.contains('home-reveal');
    var frag = doc.createDocumentFragment();
    [].slice.call(nd.body.childNodes).forEach(function (n) { if (!persistent(n)) frag.appendChild(doc.adoptNode(n)); });
    view.replaceChildren(frag);
    doc.title = nd.title;
    var md = doc.querySelector('meta[name="description"]'), nmd = nd.querySelector('meta[name="description"]');
    if (md && nmd) md.setAttribute('content', nmd.getAttribute('content'));
    body.className = nd.body.className + ' rt-busy'; body.id = nd.body.id || '';
    /* guides grid: present on inner pages only */
    var ng = nd.body.querySelector(':scope > .guides');
    if (ng && !guides) { guides = doc.adoptNode(ng); body.insertBefore(guides, header || view); }
    if (guides) guides.hidden = !ng;
    /* active nav item: mirror the target page's own markup (detail page keeps 项目 active) */
    if (header) {
      var cur = [].slice.call(nd.querySelectorAll('.site-header .nav-links a')).map(function (a) { return a.getAttribute('aria-current'); });
      [].forEach.call(header.querySelectorAll('.nav-links a'), function (a, i) { if (cur[i]) a.setAttribute('aria-current', cur[i]); else a.removeAttribute('aria-current'); });
      var pb = header.querySelector('.progress'); if (pb) pb.style.width = '0';
      if (fromHome && !body.classList.contains('home-reveal') && !mqReduce.matches)
        header.animate([{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: 420, easing: EASE_OUT });
    }
    placeInd(true);
    if (opts.push) history.pushState({ rt: 1, y: 0 }, '', u.href);
    window.scrollTo(0, opts.y || 0);
    var m = doc.getElementById('main');
    if (m) { if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); }
  }

  function enter(reduce) {
    finishAnim(outAnim); outAnim = null;
    if (reduce) { inAnim = view.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }); return; }
    var top = Math.max(0, view.getBoundingClientRect().top), H = Math.max(200, window.innerHeight - top), VH = view.offsetHeight;
    var D = 380;
    inAnim = view.animate([
      { clipPath: 'inset(0px 0px ' + VH + 'px 0px)', filter: 'blur(6px)', opacity: .35, transform: 'translateY(8px)' },
      { clipPath: 'inset(0px 0px ' + Math.max(0, VH - H) + 'px 0px)', filter: 'blur(0px)', opacity: 1, transform: 'translateY(0)' }
    ], { duration: D, easing: EASE_OUT });
    scan.style.top = top + 'px';
    scanAnim = scan.animate([
      { transform: 'translateY(0)', opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .8 },
      { transform: 'translateY(' + H + 'px)', opacity: 0 }
    ], { duration: D, easing: EASE_OUT });
  }

  /* ---- wiring ---- */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'), u = eligible(a, e);
    if (!u) return;
    e.preventDefault();
    if (key(u) === key(location) && !busy) { window.scrollTo({ top: 0, behavior: mqReduce.matches ? 'auto' : 'smooth' }); return; }
    go(u, { push: true });
  });
  var shown = key(location);
  window.addEventListener('popstate', function (e) {
    if (key(location) === shown) return;            /* hash-only history step inside the same page */
    shown = key(location);
    go(new URL(location.href), { push: false, y: e.state && e.state.y || 0 });
  });
  var _push = history.pushState;
  history.pushState = function (s, t, url) { _push.apply(history, arguments); shown = key(location); };
  history.replaceState({ rt: 1, y: window.scrollY }, '');
})();
