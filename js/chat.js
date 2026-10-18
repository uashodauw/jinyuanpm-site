/* JINYUAN — "问问 JinYuan 的 AI 分身" chat panel.
   Opened from any [data-chat-open] trigger (homepage hero logo pill + the regular header pill).
   The panel lives in #rt-chat (ids starting with rt- are kept by js/router.js), so it survives in-place page swaps.
   Talks only to /api/chat (Vercel function, DeepSeek); no key or model config in the client. */
(function () {
  if (window.__chat) return; window.__chat = 1;
  var doc = document, panel, log, form, input, sendBtn, sugg, opener = null, busy = false, msgs = [], ctrl = null;
  var SUG = ['他做过哪些 AI 项目？', '在转转负责什么？', '他怎么看 Agent？'];
  var WELCOME = '你好，我是金沅的 AI 分身，可以介绍他的经历、项目、文章观点和联系方式。想了解什么？';

  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function build() {
    panel = el('div', 'chat-panel'); panel.id = 'rt-chat';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'chat-title'); panel.hidden = true;
    panel.innerHTML =
      '<div class="chat-head"><span class="chat-dot" aria-hidden="true"></span><div class="chat-ttl"><b id="chat-title">JinYuan 的 AI 分身</b><span>聊聊他的经历、项目和 AI 观点</span></div>' +
      '<button type="button" class="chat-x" aria-label="关闭对话">×</button></div>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<div class="chat-sugg" role="group" aria-label="推荐问题"></div>' +
      '<form class="chat-form" autocomplete="off"><label class="sr-only" for="chat-in">输入问题</label>' +
      '<textarea id="chat-in" rows="1" maxlength="2000" placeholder="问问他的经历、项目或观点…"></textarea>' +
      '<button type="submit" class="chat-send" aria-label="发送"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form>';
    doc.body.appendChild(panel);
    log = panel.querySelector('.chat-log'); form = panel.querySelector('.chat-form'); input = panel.querySelector('textarea');
    sendBtn = panel.querySelector('.chat-send'); sugg = panel.querySelector('.chat-sugg');
    SUG.forEach(function (q) { var b = el('button', 'chat-chip'); b.type = 'button'; b.textContent = q; b.addEventListener('click', function () { ask(q); }); sugg.appendChild(b); });
    panel.querySelector('.chat-x').addEventListener('click', close);
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
    input.addEventListener('input', grow);
    bubble('bot', WELCOME);
  }
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }
  function bubble(who, text) {
    var b = el('div', 'chat-msg ' + (who === 'me' ? 'me' : 'bot')); b.textContent = text || ''; log.appendChild(b); log.scrollTop = log.scrollHeight; return b;
  }
  function open(trigger) {
    if (!panel || !doc.body.contains(panel)) build();
    opener = trigger || doc.activeElement; panel.hidden = false;
    if (trigger && matchMedia('(min-width: 641px)').matches) {   /* desktop: hang the panel under the trigger that opened it */
      var r = trigger.getBoundingClientRect();
      panel.style.left = Math.max(12, Math.min(r.left - 6, innerWidth - panel.offsetWidth - 12)) + 'px'; panel.style.top = Math.round(r.bottom + 12) + 'px';
      panel.style.height = 'min(580px, calc(100vh - ' + Math.round(r.bottom + 36) + 'px))';
    } else { panel.style.left = panel.style.top = panel.style.height = ''; }
    requestAnimationFrame(function () { panel.classList.add('open'); });
    doc.documentElement.classList.add('chat-on');
    [].forEach.call(doc.querySelectorAll('[data-chat-open]'), function (t) { t.setAttribute('aria-expanded', 'true'); });
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function close() {
    if (!panel || panel.hidden) return;
    panel.classList.remove('open'); doc.documentElement.classList.remove('chat-on');
    [].forEach.call(doc.querySelectorAll('[data-chat-open]'), function (t) { t.setAttribute('aria-expanded', 'false'); });
    setTimeout(function () { if (!panel.classList.contains('open')) panel.hidden = true; }, 220);
    if (opener && opener.focus && doc.body.contains(opener)) opener.focus({ preventScroll: true });
  }
  function setBusy(v) { busy = v; sendBtn.disabled = v; panel.classList.toggle('busy', v); }
  function ask(q) {
    q = (q || '').trim(); if (!q || busy) return;
    if (q.length > 2000) q = q.slice(0, 2000);
    input.value = ''; grow(); sugg.hidden = true;
    bubble('me', q); msgs.push({ role: 'user', content: q });
    var b = bubble('bot', ''); b.classList.add('typing'); b.innerHTML = '<i></i><i></i><i></i>';
    setBusy(true);
    var text = '', failed = null;
    ctrl = window.AbortController ? new AbortController() : null;
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs.slice(-8) }), signal: ctrl && ctrl.signal })
      .then(function (r) {
        var ct = r.headers.get('content-type') || '';
        if (!r.ok || ct.indexOf('event-stream') < 0) return r.json().catch(function () { return {}; }).then(function (j) { failed = j.error || '暂时无法回答，请稍后再试。'; });
        var rd = r.body.getReader(), dec = new TextDecoder(), buf = '';
        function pump() {
          return rd.read().then(function (x) {
            if (x.done) return;
            buf += dec.decode(x.value, { stream: true });
            var i;
            while ((i = buf.indexOf('\n\n')) >= 0) {
              var line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
              if (line.indexOf('data:') !== 0) continue;
              try {
                var o = JSON.parse(line.slice(5));
                if (o.t) { if (!text) { b.classList.remove('typing'); b.textContent = ''; } text += o.t; b.textContent = text; log.scrollTop = log.scrollHeight; }
                if (o.error) failed = o.error;
              } catch (e) {}
            }
            return pump();
          });
        }
        return pump();
      })
      .catch(function () { failed = failed || '网络好像断了，请稍后再试。'; })
      .then(function () {
        if (!text) { b.classList.remove('typing'); b.classList.add('err'); b.textContent = failed || '暂时无法回答，请稍后再试。'; msgs.pop(); }
        else { msgs.push({ role: 'assistant', content: text }); if (failed) { var e = el('div', 'chat-note'); e.textContent = failed; log.appendChild(e); } }
        setBusy(false); log.scrollTop = log.scrollHeight;
      });
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-chat-open]');
    if (t) { e.preventDefault(); if (panel && !panel.hidden && panel.classList.contains('open')) close(); else open(t); }
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && !panel.hidden) { e.stopPropagation(); close(); } }, true);
})();
