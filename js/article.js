/* article.html?slug=… — renders an article from js/articles-data.js (compact banner + narrow reading column) */
(function () {
  var D = window.ARTICLES || [], root = document.getElementById('article-root'); if (!root) return;
  var slug = new URLSearchParams(location.search).get('slug');
  /* old sample-article slugs → closest real article (no 404s for old links) */
  var OLD = { 'demo-to-scale': 'evaluating-agents', 'copilot-to-agent': 'workflow-vs-agent', 'pm-beyond-model-capability': 'pm-value-vibe-coding',
    'trust-in-genai-design': 'evaluating-agents', 'is-ai-feature-valuable': 'ai-customer-service-rollout' };
  if (slug && OLD[slug]) { slug = OLD[slug]; history.replaceState(history.state, '', 'article.html?slug=' + slug + location.hash); }
  var sorted = D.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var a = D.filter(function (x) { return x.slug === slug; })[0] || (slug ? null : sorted[0]);
  var esc = MiniMD.esc;
  if (!a) {
    document.title = '文章未找到｜JINYUAN';
    root.innerHTML = '<div class="wrap"><div class="nf"><p class="label">404 / NOT FOUND</p><h1>没有找到这篇文章</h1><p class="muted">链接可能有误，或文章已被移动。</p><p><a class="btn btn-primary" href="articles.html">返回文章列表 <span class="arr">→</span></a></p></div></div>';
    return;
  }
  var r = MiniMD.render(a.content);
  var url = location.href.split('#')[0];
  document.title = a.title + '｜JINYUAN';
  function meta(sel, v) { var m = document.querySelector(sel); if (m) m.setAttribute('content', v); }
  meta('meta[name=description]', a.excerpt);
  meta('meta[property="og:title"]', a.title); meta('meta[property="og:description"]', a.excerpt);
  meta('meta[property="og:url"]', url);
  meta('meta[property="og:image"]', a.cover + '.webp');
  var old = document.getElementById('art-ld'); if (old) old.remove();
  var ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'art-ld';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, description: a.excerpt, inLanguage: 'zh-Hans', author: { '@type': 'Person', name: '李硕金沅' }, keywords: a.tags.join(','), image: a.cover + '.webp' });
  document.head.appendChild(ld);

  var idx = sorted.indexOf(a), older = sorted[idx + 1], newer = sorted[idx - 1];
  var rel = sorted.filter(function (x) { return x !== a; }).map(function (x) {
    var s = (x.category === a.category ? 3 : 0) + x.tags.filter(function (t) { return a.tags.indexOf(t) > -1; }).length;
    return { x: x, s: s };
  }).sort(function (p, q) { return q.s - p.s || (p.x.date < q.x.date ? 1 : -1); }).slice(0, 3).map(function (o) { return o.x; });

  var toc = r.headings.map(function (h) { return '<li class="l' + h.level + '"><a href="#' + h.id + '">' + esc(h.text) + '</a></li>'; }).join('');
  var dateFmt = a.date.replace(/-/g, '.');
  var u = encodeURIComponent(url), t = encodeURIComponent(a.title);
  function card(x) {
    return '<li><article class="a-card"><a class="a-cover" href="article.html?slug=' + x.slug + '" tabindex="-1" aria-hidden="true"><img src="' + x.cover + '-sm.webp" alt="" width="640" height="' + Math.round(x.coverH * 640 / x.coverW) + '" loading="lazy" decoding="async"></a>' +
      '<div class="a-body"><span class="a-cat">' + esc(x.category) + '</span><h3><a class="a-link" href="article.html?slug=' + x.slug + '">' + esc(x.title) + '</a></h3>' +
      '<p class="a-meta"><time datetime="' + x.date + '">' + x.date.replace(/-/g, '.') + '</time> · 阅读约 ' + x.readTime + ' 分钟</p></div></article></li>';
  }
  var html =
    '<div class="wrap"><div class="art-layout ar">' +
    '<div class="ar-top">' +
    '<p class="ar-crumb"><a href="articles.html">← 全部文章</a></p>' +
    '<figure class="ar-banner"><img src="' + a.cover + '.webp" alt="' + esc(a.coverAlt) + '" width="' + a.coverW + '" height="' + a.coverH + '" decoding="async" fetchpriority="high"></figure>' +
    '<header class="art-head ar-head"><p class="ar-meta"><a class="a-cat" href="articles.html?cat=' + encodeURIComponent(a.category) + '">' + esc(a.category) + '</a>' +
    '<span><time datetime="' + a.date + '">' + dateFmt + '</time></span><span>阅读约 ' + a.readTime + ' 分钟</span><span>李硕金沅</span></p>' +
    '<h1>' + esc(a.title) + '</h1><p class="excerpt">' + esc(a.excerpt) + '</p></header></div>' +
    '<nav class="toc" aria-label="文章目录"><h2>目录</h2><ol>' + toc + '</ol></nav>' +
    '<details class="toc-m"><summary>目录 / CONTENTS</summary><ol>' + toc + '</ol></details>' +
    '<div class="prose" id="prose">' + r.html +
    (a.source ? '<p class="ar-source"><a href="' + esc(a.source) + '" target="_blank" rel="noopener noreferrer">阅读公众号原文 ↗</a></p>' : '') + '</div>' +
    '<aside class="art-aside" aria-label="分享"><h2>分享</h2><div class="share">' +
    '<button type="button" id="share-copy">复制链接</button>' +
    '<a target="_blank" rel="noopener noreferrer" href="https://service.weibo.com/share/share.php?url=' + u + '&title=' + t + '">分享到微博</a>' +
    '<a href="mailto:?subject=' + t + '&body=' + u + '">邮件分享</a></div></aside></div>' +
    '<div class="ar-end">' +
    '<div class="prevnext" aria-label="上一篇与下一篇">' +
    (older ? '<a href="article.html?slug=' + older.slug + '" rel="prev"><span class="k">← 上一篇</span><span class="t">' + esc(older.title) + '</span></a>' : '<div class="none">已是最早的一篇</div>') +
    (newer ? '<a href="article.html?slug=' + newer.slug + '" rel="next"><span class="k">下一篇 →</span><span class="t">' + esc(newer.title) + '</span></a>' : '<div class="none" style="text-align:right">已是最新的一篇</div>') + '</div>' +
    '<p class="label ar-rel-h">相关文章 / RELATED</p><ul class="a-grid a-grid-sm">' + rel.map(card).join('') + '</ul></div></div>';
  root.innerHTML = html;

  document.getElementById('share-copy').addEventListener('click', function () { window.copyText(url, this, '已复制 ✓'); });

  /* reading progress */
  var bar = document.querySelector('.progress'), prose = document.getElementById('prose');
  function onScroll() {
    var rc = prose.getBoundingClientRect(), total = rc.height - window.innerHeight * 0.6;
    var p = Math.min(1, Math.max(0, (-rc.top + 80) / Math.max(total, 1)));
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); onScroll();
  var so = null;
  if (window.Site && Site.onLeave) Site.onLeave(function () {
    window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll);
    if (so) so.disconnect(); if (bar) bar.style.width = '0';
  });

  /* toc scroll-spy */
  var tl = [].slice.call(document.querySelectorAll('.toc a'));
  if (tl.length && 'IntersectionObserver' in window) {
    var by = {}; tl.forEach(function (x) { by[x.getAttribute('href').slice(1)] = x; });
    so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { tl.forEach(function (x) { x.classList.remove('active'); }); by[e.target.id].classList.add('active'); } });
    }, { rootMargin: '-80px 0px -70% 0px' });
    r.headings.forEach(function (h) { var el = document.getElementById(h.id); if (el) so.observe(el); });
  }
})();
