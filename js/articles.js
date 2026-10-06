/* articles.html — live keyword search + category chips (works on the server-rendered list) */
(function () {
  var list = document.getElementById('alist'); if (!list) return;
  var items = [].slice.call(list.querySelectorAll('li'));
  /* keep the list in date order, newest first (data-date="YYYY-MM-DD"; falls back to window.ARTICLES by slug) */
  var byslug = {}; (window.ARTICLES || []).forEach(function (a) { byslug[a.slug] = a.date; });
  function dateOf(li) {
    if (li.getAttribute('data-date')) return li.getAttribute('data-date');
    var m = (li.querySelector('a[href*="slug="]') || { getAttribute: function () { return ''; } }).getAttribute('href').match(/slug=([^&#]+)/);
    return (m && byslug[decodeURIComponent(m[1])]) || '';
  }
  items = items.map(function (li, i) { return { li: li, d: dateOf(li), i: i }; })
    .sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : a.i - b.i; })
    .map(function (o) { list.appendChild(o.li); return o.li; });
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var input = document.getElementById('q');
  var info = document.getElementById('result-info'), empty = document.getElementById('empty');
  var cat = '全部', q = '';
  var params = new URLSearchParams(location.search);
  if (params.get('cat')) cat = params.get('cat');
  if (params.get('q')) { q = params.get('q'); input.value = q; }
  function norm(s) { return s.toLowerCase(); }
  function apply() {
    var n = 0, kw = norm(q.trim());
    items.forEach(function (li) {
      var okCat = cat === '全部' || li.getAttribute('data-cat') === cat;
      var okQ = !kw || norm(li.getAttribute('data-search')).indexOf(kw) > -1;
      li.hidden = !(okCat && okQ); if (!li.hidden) n++;
    });
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-cat') === cat); });
    info.textContent = '共 ' + n + ' 篇' + (cat !== '全部' ? ' · 分类：' + cat : '') + (q.trim() ? ' · 关键词：' + q.trim() : '');
    empty.hidden = n !== 0;
    empty.querySelector('p').textContent = (cat !== '全部' && !q.trim()) ? '该分类下暂时还没有文章，欢迎稍后再来，或查看其他分类。' : '没有找到相关文章，试试更短的关键词或清除筛选。';
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { cat = c.getAttribute('data-cat'); apply(); }); });
  input.addEventListener('input', function () { q = input.value; apply(); });
  document.getElementById('reset').addEventListener('click', function () { cat = '全部'; q = ''; input.value = ''; apply(); input.focus(); });
  apply();
})();
