/* article.html?slug=… — renders Markdown-style content from js/articles-data.js */
(function () {
  var D = window.ARTICLES || [], root = document.getElementById('article-root'); if (!root) return;
  var slug = new URLSearchParams(location.search).get('slug');
  var sorted = D.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var a = D.filter(function (x) { return x.slug === slug; })[0] || (slug ? null : sorted[0]);
  var esc = MiniMD.esc;
  function pic(name, alt, cls, eager) {
    return '<picture><source type="image/webp" srcset="assets/' + name + '-sm.webp 480w, assets/' + name + '.webp 960w" sizes="(max-width:700px) 100vw, 400px">' +
      '<img src="assets/' + name + '.jpg" srcset="assets/' + name + '-sm.jpg 480w, assets/' + name + '.jpg 960w" sizes="(max-width:700px) 100vw, 400px" alt="' + esc(alt) + '" width="960" height="540" loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async"></picture>';
  }
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
  var ld = document.createElement('script'); ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, description: a.excerpt, inLanguage: 'zh-Hans', author: { '@type': 'Person', name: '李硕金沅' }, keywords: a.tags.join(',') });
  document.head.appendChild(ld);

  var idx = sorted.indexOf(a), older = sorted[idx + 1], newer = sorted[idx - 1];
  var rel = sorted.filter(function (x) { return x !== a; }).map(function (x) {
    var s = (x.category === a.category ? 3 : 0) + x.tags.filter(function (t) { return a.tags.indexOf(t) > -1; }).length;
    return { x: x, s: s };
  }).sort(function (p, q) { return q.s - p.s || (p.x.date < q.x.date ? 1 : -1); }).slice(0, 3).map(function (o) { return o.x; });

  var toc = r.headings.map(function (h) { return '<li class="l' + h.level + '"><a href="#' + h.id + '">' + esc(h.text) + '</a></li>'; }).join('');
  var dateFmt = a.date.replace(/-/g, '.');
  var u = encodeURIComponent(url), t = encodeURIComponent(a.title);
  /* decorative, semi-transparent cover on the right side of the article area (replaces the old full-width cover) */
  var bg = '<div class="art-bg" aria-hidden="true"><picture>' +
    '<source type="image/webp" srcset="assets/' + a.cover + '-sm.webp 480w, assets/' + a.cover + '.webp 960w" sizes="(max-width:900px) 75vw, 760px">' +
    '<img src="assets/' + a.cover + '.jpg" srcset="assets/' + a.cover + '-sm.jpg 480w, assets/' + a.cover + '.jpg 960w" sizes="(max-width:900px) 75vw, 760px" alt="" width="960" height="540" decoding="async"></picture></div>';
  var html = bg +
    '<header class="art-head"><div class="wrap"><div class="hd">' +
    '<p class="label"><a href="articles.html?cat=' + encodeURIComponent(a.category) + '" style="color:inherit">' + esc(a.category) + '</a></p>' +
    '<h1>' + esc(a.title) + '</h1><p class="excerpt">' + esc(a.excerpt) + '</p>' +
    '<p class="meta" style="margin-top:22px"><span>' + dateFmt + '</span><span>阅读约 ' + a.readTime + ' 分钟</span><span>作者 李硕金沅</span></p>' +
    '</div></div></header>' +
    '<div class="wrap">' +
    '<div class="art-layout"><nav class="toc" aria-label="文章目录"><h2>目录</h2><ol>' + toc + '</ol></nav>' +
    '<details class="toc-m"><summary>目录 / CONTENTS</summary><ol>' + toc + '</ol></details>' +
    '<div class="prose" id="prose">' + r.html + '</div>' +
    '<aside class="art-aside" aria-label="分享"><h2>分享</h2><div class="share">' +
    '<button type="button" id="share-copy">复制链接</button>' +
    '<a target="_blank" rel="noopener noreferrer" href="https://service.weibo.com/share/share.php?url=' + u + '&title=' + t + '">分享到微博</a>' +
    '<a target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?url=' + u + '&text=' + t + '">分享到 X</a>' +
    '<a href="mailto:?subject=' + t + '&body=' + u + '">邮件分享</a></div></aside></div></div>' +
    '<div class="art-end"><div class="wrap">' +
    '<div class="prevnext" aria-label="上一篇与下一篇">' +
    (older ? '<a href="article.html?slug=' + older.slug + '" rel="prev"><span class="k">← 上一篇</span><span class="t">' + esc(older.title) + '</span></a>' : '<div class="none">已是最早的一篇</div>') +
    (newer ? '<a href="article.html?slug=' + newer.slug + '" rel="next"><span class="k">下一篇 →</span><span class="t">' + esc(newer.title) + '</span></a>' : '<div class="none" style="text-align:right">已是最新的一篇</div>') + '</div>' +
    '<div class="related-h"><p class="label">相关文章 / RELATED</p><h2>继续阅读</h2></div>' +
    '<div class="cards3" style="padding-bottom:56px">' + rel.map(function (x) {
      return '<article class="acard"><a class="cover" href="article.html?slug=' + x.slug + '" tabindex="-1" aria-hidden="true">' + pic(x.cover, x.coverAlt) + '</a>' +
        '<div class="meta"><span class="cat">' + esc(x.category) + '</span><span>' + x.date.replace(/-/g, '.') + '</span></div>' +
        '<h3><a href="article.html?slug=' + x.slug + '">' + esc(x.title) + '</a></h3><p>' + esc(x.excerpt) + '</p></article>';
    }).join('') + '</div>' +
    '<p class="sample-note">示例文章 — 本页内容为演示用的示例文章，正式发布前请替换为你自己的原创内容。</p></div></div>';
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

  /* toc scroll-spy */
  var tl = [].slice.call(document.querySelectorAll('.toc a'));
  if (tl.length && 'IntersectionObserver' in window) {
    var by = {}; tl.forEach(function (x) { by[x.getAttribute('href').slice(1)] = x; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { tl.forEach(function (x) { x.classList.remove('active'); }); by[e.target.id].classList.add('active'); } });
    }, { rootMargin: '-80px 0px -70% 0px' });
    r.headings.forEach(function (h) { var el = document.getElementById(h.id); if (el) so.observe(el); });
  }
})();
