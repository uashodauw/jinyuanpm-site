/* Tiny Markdown renderer (headings ##/###, paragraphs, lists, check-lists, blockquote,
   fenced code, images with captions, hr, **bold**, *em*, `code`, [links](url)). */
(function (root) {
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function inline(s) {
    var stash = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) { stash.push('<code>' + esc(c) + '</code>'); return '\u0000' + (stash.length - 1) + '\u0000'; });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
      if (!/^(https?:|mailto:|#|[\w./-]+)/i.test(u) || /^javascript:/i.test(u)) return t;
      var ext = /^https?:/i.test(u);
      return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + t + '</a>';
    });
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return stash[+i]; });
  }
  function picture(src, alt) {
    var webp = src.replace(/\.(jpe?g|png)$/i, '.webp');
    return '<picture><source type="image/webp" srcset="' + esc(webp) + '"><img src="' + esc(src) + '" alt="' + esc(alt) +
      '" width="960" height="540" loading="lazy" decoding="async"></picture>';
  }
  function render(md) {
    var lines = md.replace(/\r\n?/g, '\n').split('\n'), out = [], heads = [], i = 0, para = [];
    function flush() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    while (i < lines.length) {
      var l = lines[i], m;
      if ((m = l.match(/^```\s*(\w*)/))) {
        flush(); var code = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
        i++;
        out.push('<div class="code"><div class="code-bar"><span>' + esc(m[1] || 'text') + '</span><button type="button" class="copy" data-copy-code>复制</button></div><pre><code>' + esc(code.join('\n')) + '</code></pre></div>');
        continue;
      }
      if ((m = l.match(/^(#{2,3})\s+(.+)$/))) {
        flush();
        var id = 'sec-' + (heads.length + 1);
        heads.push({ level: m[1].length, text: m[2].replace(/[*`]/g, ''), id: id });
        out.push('<h' + m[1].length + ' id="' + id + '">' + inline(m[2]) + '</h' + m[1].length + '>');
        i++; continue;
      }
      if (/^>\s?/.test(l)) {
        flush(); var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
        out.push('<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>');
        continue;
      }
      if ((m = l.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/))) {
        flush();
        out.push('<figure>' + picture(m[2], m[1]) + (m[3] ? '<figcaption>' + inline(m[3]) + '</figcaption>' : '') + '</figure>');
        i++; continue;
      }
      if (/^\s*[-*]\s+/.test(l)) {
        flush(); var items = [], check = false;
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          var t = lines[i++].replace(/^\s*[-*]\s+/, '');
          if (/^\[[ x]\]\s/.test(t)) { check = true; t = t.replace(/^\[[ x]\]\s/, ''); }
          items.push('<li>' + inline(t) + '</li>');
        }
        out.push('<ul' + (check ? ' class="check"' : '') + '>' + items.join('') + '</ul>');
        continue;
      }
      if (/^\d+\.\s+/.test(l)) {
        flush(); var oi = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) oi.push('<li>' + inline(lines[i++].replace(/^\d+\.\s+/, '')) + '</li>');
        out.push('<ol>' + oi.join('') + '</ol>');
        continue;
      }
      if (/^(-{3,}|\*{3,})\s*$/.test(l)) { flush(); out.push('<hr>'); i++; continue; }
      if (/^\s*$/.test(l)) { flush(); i++; continue; }
      para.push(l.trim()); i++;
    }
    flush();
    return { html: out.join('\n'), headings: heads };
  }
  root.MiniMD = { render: render, esc: esc };
})(window);
