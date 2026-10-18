/* JINYUAN site — shared behaviour: mobile menu, reveal-on-scroll, scroll-spy, copy buttons, contact form */
(function () {
  var doc = document, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* mobile menu */
  var toggle = doc.querySelector('.nav-toggle'), links = doc.getElementById('nav-links');
  function setMenu(open) {
    if (!toggle || !links) return;
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    links.classList.toggle('open', open);
    doc.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); } });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
    // mobile: links are hidden (visibility) when closed so they are not tabbable
  }
  window.Site = window.Site || {};
  /* page-leave hooks: page scripts register teardown (listeners, observers, RAF) here; the router runs them before swapping */
  var leave = [];
  Site.onLeave = function (fn) { leave.push(fn); };
  Site.leave = function () { var l = leave; leave = []; l.forEach(function (fn) { try { fn(); } catch (e) { setTimeout(function () { throw e; }); } }); };
  Site.closeMenu = function () { if (links && links.classList.contains('open')) setMenu(false); };

  /* copy helpers */
  function copyText(text, btn, okLabel) {
    function done() { if (!btn) return; var o = btn.textContent; btn.textContent = okLabel || '已复制'; setTimeout(function () { btn.textContent = o; }, 1600); }
    if (navigator.clipboard && window.isSecureContext !== false) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    function fallback() {
      var t = doc.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      doc.body.appendChild(t); t.select(); try { doc.execCommand('copy'); done(); } catch (e) {} doc.body.removeChild(t);
    }
  }
  window.copyText = copyText;
  doc.addEventListener('click', function (e) {
    var dis = e.target.closest('a[aria-disabled="true"]');
    if (dis) { e.preventDefault(); return; }
    var b = e.target.closest('[data-copy]');
    if (b) { copyText(b.getAttribute('data-copy'), b); return; }
    var c = e.target.closest('[data-copy-code]');
    if (c) { var code = c.closest('.code').querySelector('code'); copyText(code.textContent, c); }
  });

  /* per-page init — runs on load and again after every client-side (router) navigation */
  Site.initPage = function () {
    /* reveal on scroll (fade only) */
    var rev = [].slice.call(doc.querySelectorAll('.reveal:not(.in)'));
    if (rev.length) {
      if (reduce || !('IntersectionObserver' in window)) rev.forEach(function (n) { n.classList.add('in'); });
      else {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
        rev.forEach(function (n) { io.observe(n); });
        Site.onLeave(function () { io.disconnect(); });
      }
    }

    /* contact form: client-side validation, then Formspree-style endpoint OR mailto fallback */
    var form = doc.getElementById('contact-form');
    if (form) {
      var status = form.querySelector('.form-status');
      var rules = {
        name: function (v) { return v.trim() ? '' : '请填写你的姓名。'; },
        email: function (v) {
          if (!v.trim()) return '请填写你的邮箱，方便我回复你。';
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : '邮箱格式似乎不正确，例如 name@example.com。';
        },
        message: function (v) {
          if (!v.trim()) return '请写下你想说的内容。';
          return v.trim().length < 10 ? '留言内容至少需要 10 个字符。' : '';
        }
      };
      function check(el) {
        var msg = rules[el.name](el.value), err = doc.getElementById(el.id + '-error');
        err.textContent = msg;
        if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
        return !msg;
      }
      ['name', 'email', 'message'].forEach(function (n) {
        var el = form.elements[n];
        el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) check(el); });
        el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) check(el); });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var first = null;
        ['name', 'email', 'message'].forEach(function (n) { var el = form.elements[n]; if (!check(el) && !first) first = el; });
        status.hidden = true;
        if (first) { first.focus(); return; }
        var data = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), message: form.elements.message.value.trim() };
        var endpoint = form.getAttribute('data-endpoint');
        /* To receive messages without a mail client, set data-endpoint on the <form> to e.g.
           https://formspree.io/f/xxxxxxx  (or a Netlify Forms / Getform / own API URL).
           Leave it empty to use the mailto: fallback below. */
        if (endpoint) {
          fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
            .then(function (r) {
              if (!r.ok) throw new Error('bad');
              status.textContent = '提交成功，谢谢你的留言！我会尽快回复。';
              status.hidden = false; form.reset();
            })
            .catch(function () { status.textContent = '提交失败，请稍后重试，或直接通过邮箱 / 微信联系我。'; status.hidden = false; });
          return;
        }
        var to = form.getAttribute('data-mailto');
        var href = 'mailto:' + to + '?subject=' + encodeURIComponent('[网站留言] 来自 ' + data.name) +
          '&body=' + encodeURIComponent(data.message + '\n\n——\n' + data.name + '\n' + data.email);
        status.innerHTML = '内容已校验通过。正在为你打开邮件客户端；如果没有弹出，请 <a href="' + href.replace(/"/g, '&quot;') + '">点击这里发送邮件</a>，或直接联系 ' + to.replace(/</g, '&lt;') + '。';
        status.hidden = false;
        window.location.href = href;
      });
    }

    /* footer year */
    var y = doc.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  };
  Site.initPage();
})();
