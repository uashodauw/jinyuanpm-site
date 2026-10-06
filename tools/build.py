#!/usr/bin/env python3
"""Optional generator: regenerates the static HTML pages + js/articles-data.js from
tools/articles/*.md and the templates in this file.  The site itself needs NO build step —
you can also edit the generated .html files directly.   Usage:  python3 tools/build.py
"""
import json, re, math, html, pathlib, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
E = html.escape

# ------------------------------------------------------------------ config (edit here, or edit the HTML)
SITE = "JINYUAN｜AI 产品与智能体验"
NAME = "李硕金沅"
ROLE = "高级 AI 产品经理"
EMAIL = "shuojinyuanli@gmail.com"        
GITHUB = "Uashodauw"
GITHUB_URL = "https://github.com/Uashodauw"
WECHAT = "1372937074"
DESC = "李硕金沅（JINYUAN）｜高级 AI 产品经理。专注于人工智能产品、用户体验与商业化创新，关注 AI 产品设计、智能体、生成式 AI、用户需求与技术落地。"
CATEGORIES = ["AI 产品经理方法论", "生成式 AI 产品设计", "AI Agent 产品化", "大模型应用实践",
              "AI 与工作方式", "用户体验与人工智能", "AI 产品商业模式", "行业趋势与个人观察"]

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Crect width='28' height='28' fill='%23000'/%3E"
           "%3Crect x='3' y='3' width='10' height='10' fill='%23fff'/%3E%3Cpath d='M15 13V3a10 10 0 0 1 10 10z' fill='none' stroke='%23fff' stroke-width='1.6'/%3E"
           "%3Crect x='3.8' y='15.8' width='8.4' height='8.4' fill='none' stroke='%23fff' stroke-width='1.6'/%3E%3Cpath d='M15 25V15h10z' fill='%237fa38f'/%3E%3C/svg%3E")

LOGO = ('<svg viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false"><rect x="2" y="2" width="11" height="11" fill="currentColor"/>'
        '<path d="M15 13V2a11 11 0 0 1 11 11z" stroke="currentColor" stroke-width="1.6"/><rect x="2.8" y="15.8" width="9.4" height="9.4" stroke="currentColor" stroke-width="1.6"/>'
        '<path d="M15 26V15h11z" fill="currentColor"/></svg>')

# ------------------------------------------------------------------ articles
def parse_md(p):
    t = p.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", t, re.S)
    meta = dict(l.split(": ", 1) for l in m.group(1).splitlines() if ": " in l)
    body = m.group(2).strip()
    chars = len(re.sub(r"\s", "", re.sub(r"```.*?```", "", body, flags=re.S)))
    return {
        "slug": meta["slug"], "title": "《%s》" % meta["title"], "category": meta["category"],
        "tags": [x.strip() for x in meta["tags"].split(",")], "date": meta["date"],
        "cover": meta["cover"], "coverAlt": meta["cover_alt"], "excerpt": meta["excerpt"],
        "readTime": max(1, math.ceil(chars / 400)), "content": body,
    }

ARTICLES = sorted((parse_md(p) for p in sorted((ROOT / "tools/articles").glob("*.md"))), key=lambda a: a["date"], reverse=True)
(ROOT / "js/articles-data.js").write_text(
    "/* Generated from tools/articles/*.md by tools/build.py — sample articles. Edit the .md files (or this array) to publish your own. */\n"
    "window.ARTICLES = " + json.dumps(ARTICLES, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")

def pic(name, alt, w=960, h=540, cls="", eager=False, sizes="(max-width:900px) 100vw, 400px", small=True):
    ld = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    if small:
        webp = f'<source type="image/webp" srcset="assets/{name}-sm.webp 480w, assets/{name}.webp 960w" sizes="{sizes}">'
        img = f'src="assets/{name}.jpg" srcset="assets/{name}-sm.jpg 480w, assets/{name}.jpg 960w" sizes="{sizes}"'
    else:
        webp = f'<source type="image/webp" srcset="assets/{name}.webp">'
        img = f'src="assets/{name}.jpg"'
    return f'<picture>{webp}<img {img} alt="{E(alt)}" width="{w}" height="{h}" {ld} decoding="async"{(" class=%s" % chr(34)+cls+chr(34)) if cls else ""}></picture>'

def fmt(d): return d.replace("-", ".")

# ------------------------------------------------------------------ shared partials
NAV = [("首页", "#top", "index.html", "top"), ("关于我", "#about", "index.html#about", "about"),
       ("项目经验", "#projects", "index.html#projects", "projects"), ("文章", "#articles", "articles.html", "articles"),
       ("观点", "#opinions", "index.html#opinions", "opinions"), ("工作经历", "#experience", "index.html#experience", "experience"),
       ("联系", "#contact", "contact.html", "contact")]

def head(title, desc, page, extra="", og_type="website", jsonld=True):
    ld = ""
    if jsonld:
        ld = '<script type="application/ld+json">' + json.dumps({
            "@context": "https://schema.org", "@type": "Person", "name": NAME, "alternateName": "JINYUAN",
            "jobTitle": ROLE, "description": DESC, "inLanguage": "zh-Hans",
            "knowsAbout": ["AI 产品管理", "生成式 AI", "AI Agent", "用户体验"], "sameAs": [GITHUB_URL]}, ensure_ascii=False) + "</script>"
    return f'''<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta name="theme-color" content="#000000">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{E(SITE)}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:locale" content="zh_CN">
<!-- For a real deployment make og:image / og:url absolute, e.g. https://your-domain.com/assets/og.jpg -->
<meta property="og:image" content="assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{FAVICON}">
<link rel="stylesheet" href="css/style.css">
<script>document.documentElement.classList.add('js')</script>
{extra}{ld}
</head>
<body id="top">
<a class="skip" href="#main">跳到主要内容</a>
<div class="guides" aria-hidden="true"><div><span></span><span></span><span></span><span></span></div></div>
'''

def header(page, progress=False):
    items = []
    for label, home_h, other_h, sid in NAV:
        if page == "home":
            href, spy = home_h, f' data-spy="{sid}"'
            cur = ""
        else:
            href, spy = other_h, ""
            cur = ' aria-current="page"' if (page == "articles" and sid == "articles") or (page == "contact" and sid == "contact") or (page == "article" and sid == "articles") else ""
        if page == "home" and sid == "top": href = "#top"
        items.append(f'<li><a href="{href}"{spy}{cur}>{label}</a></li>')
    home = "#top" if page == "home" else "index.html"
    return f'''<header class="site-header">
 <div class="wrap"><div class="nav-inner">
  <a class="logo" href="{home}" aria-label="JINYUAN 首页">{LOGO}<span class="wm">JINYUAN</span></a>
  <nav aria-label="主导航"><ul class="nav-links" id="nav-links">{"".join(items)}</ul></nav>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="打开菜单"><span></span></button>
 </div></div>
 {'<div class="progress" aria-hidden="true"></div>' if progress else ''}
</header>
'''

def footer():
    cats = ["AI 产品经理方法论", "AI Agent 产品化", "生成式 AI 产品设计", "大模型应用实践"]
    newest = ARTICLES[0]
    return f'''<footer class="site-footer">
 <div class="wrap">
  <div class="foot-cols">
   <div class="fcol">
    <a class="logo" href="index.html" aria-label="JINYUAN 首页">{LOGO}<span class="wm">JINYUAN</span></a>
    <p class="name">{NAME}</p>
    <p class="tagline">{ROLE}</p>
    <p class="copy-r">© <span id="year">2026</span> {NAME} / JINYUAN.<br>保留所有权利。</p>
   </div>
   <nav class="fcol" aria-label="站点导航"><h2>导航</h2><ul>
    <li><a href="index.html">首页</a></li><li><a href="index.html#about">关于我</a></li><li><a href="index.html#projects">项目经验</a></li>
    <li><a href="index.html#opinions">我的观点</a></li><li><a href="index.html#experience">工作经历</a></li><li><a href="contact.html">联系</a></li></ul></nav>
   <nav class="fcol" aria-label="文章链接"><h2>文章</h2><ul>
    <li><a href="articles.html">全部文章</a></li><li><a href="article.html?slug={newest["slug"]}">最新文章</a></li>
    {"".join(f'<li><a href="articles.html?cat={urllib.parse.quote(c)}">{c}</a></li>' for c in cats)}</ul></nav>
   <nav class="fcol" aria-label="联系与社交媒体"><h2>联系 / 社交媒体</h2><ul>
    <li><a href="mailto:{EMAIL}">邮箱</a></li><li><a href="{GITHUB_URL}" target="_blank" rel="noopener noreferrer">GitHub</a></li>
    <li><a href="contact.html#wechat">微信</a></li><li><a href="#" aria-disabled="true" title="占位：请替换为公众号 / 社交媒体链接">公众号 [链接]</a></li></ul></nav>
  </div>
  <div class="foot-art">
   <picture><source type="image/webp" srcset="assets/footer-art.webp"><img src="assets/footer-art.jpg" alt="黑白蚀刻版画风格的沙漠沙丘与远处高原，右侧渐隐入黑色背景" width="660" height="590" loading="lazy" decoding="async"></picture>
   <div class="foot-bar"><a href="#top">返回顶部 ↑</a><span class="sep"></span><span>示例内容 · 静态站点</span></div>
  </div>
 </div>
</footer>
<script src="js/main.js" defer></script>
'''

def contact_block(h_tag="h2"):
    return f'''<div class="contact-grid">
  <div class="contact-info reveal">
   <p class="lead">无论是 AI 产品的合作交流、项目探讨，还是单纯想聊聊智能体与生成式 AI——欢迎留言。</p>
   <ul class="clist">
    <li><span class="k">邮箱</span><a class="v" id="email-link" href="mailto:{EMAIL}">{EMAIL}</a><button type="button" class="copy" data-copy="{EMAIL}" aria-label="复制邮箱">复制</button></li>
    <li><span class="k">GitHub</span><a class="v" href="{GITHUB_URL}" target="_blank" rel="noopener noreferrer">{GITHUB}</a><span></span></li>
    <li id="wechat"><span class="k">微信</span><span class="v">{WECHAT}</span><button type="button" class="copy" data-copy="{WECHAT}" aria-label="复制微信号">复制</button></li>
    <li><span class="k">公众号 / 社交</span><span class="v muted">[链接]</span><span></span></li>
   </ul>
   <p class="warn-note">注：表单与邮箱按当前提供的地址发送；邮箱与公众号链接为待确认 / 占位信息。</p>
  </div>
  <!-- HOW TO CONNECT A BACKEND: set data-endpoint below to a Formspree (https://formspree.io/f/xxxx),
       Getform, Netlify Forms-compatible JSON endpoint or your own API. The form then POSTs JSON {{name,email,message}}.
       With data-endpoint empty it falls back to opening the visitor's mail client via mailto: (data-mailto). -->
  <form class="contact-form reveal" id="contact-form" novalidate data-endpoint="" data-mailto="{EMAIL}" aria-label="联系表单">
   <div class="field"><label for="f-name">姓名 / NAME <i aria-hidden="true">*</i></label>
    <input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="f-name-error"><p class="err" id="f-name-error" role="alert"></p></div>
   <div class="field"><label for="f-email">邮箱 / EMAIL <i aria-hidden="true">*</i></label>
    <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="f-email-error"><p class="err" id="f-email-error" role="alert"></p></div>
   <div class="field"><label for="f-message">留言内容 / MESSAGE <i aria-hidden="true">*</i></label>
    <textarea id="f-message" name="message" required aria-describedby="f-message-error"></textarea><p class="err" id="f-message-error" role="alert"></p></div>
   <button class="btn btn-primary" type="submit">提交 <span class="arr" aria-hidden="true">→</span></button>
   <p class="form-status" role="status" aria-live="polite" hidden></p>
   <p class="form-hint">带 * 为必填。提交后将打开你的邮件客户端完成发送（无后端）。</p>
  </form>
 </div>'''

def sec_head(num, en, title, note=""):
    n = f'<p class="note reveal">{note}</p>' if note else ""
    return f'<div class="sec-head"><div class="cell reveal"><p class="label"><b>{num}</b> / {en}</p><h2>{title}</h2></div>{n}</div>'

def acard(a, eager=False):
    return f'''<article class="acard reveal">
   <a class="cover" href="article.html?slug={a["slug"]}" tabindex="-1" aria-hidden="true">{pic(a["cover"], a["coverAlt"])}</a>
   <div class="meta"><span class="cat">{a["category"]}</span><span>{fmt(a["date"])}</span><span>{a["readTime"]} 分钟</span></div>
   <h3><a href="article.html?slug={a["slug"]}">{E(a["title"])}</a></h3>
   <p>{E(a["excerpt"])}</p>
   <p class="more"><a class="link-arrow" href="article.html?slug={a["slug"]}" aria-label="阅读更多：{E(a["title"])}">阅读更多 <span aria-hidden="true">→</span></a></p>
  </article>'''

# ------------------------------------------------------------------ pages
PROJECTS = [
 ("企业级 AI 助手", "cover-mesa-l", "黑白蚀刻的沙漠高原轮廓", "[示例] 企业内部知识分散，员工获取信息成本高，希望借助 AI 助手提升检索与协作效率。",
  "[示例] 负责需求调研、产品方案设计，并与研发、算法团队对齐上线节奏。", "[示例] 信息难找、重复咨询多、新员工上手慢。",
  "[示例] 问答、摘要、资料检索等核心能力（请替换为真实成果）。", "[示例] 日均使用率提升 [XX%]，问题解决时长缩短 [XX%]。", ["大语言模型", "检索增强 RAG", "权限控制"]),
 ("智能客服产品", "cover-dunes", "黑白蚀刻的沙丘", "[示例] 客服咨询量大、重复问题多，需要在保证体验的同时降低人工压力。",
  "[示例] 负责对话流程设计、人机协同策略与效果评估方案。", "[示例] 响应不及时、答案不一致、复杂问题转接不顺畅。",
  "[示例] 智能问答、工单摘要、人工转接建议（请替换为真实成果）。", "[示例] 自助解决率提升 [XX%]，平均响应时间缩短 [XX%]。", ["对话系统", "意图识别", "知识库"]),
 ("AI 内容生成平台", "cover-ripples", "黑白蚀刻的沙丘纹理", "[示例] 内容生产依赖人工，效率与风格一致性难以兼顾。",
  "[示例] 负责生成场景梳理、提示词模板设计与内容质量评价标准。", "[示例] 产出慢、质量不稳定、品牌调性难统一。",
  "[示例] 多场景模板、风格控制与审核流程（请替换为真实成果）。", "[示例] 内容产出效率提升 [XX%]，人工修改比例下降 [XX%]。", ["生成式 AI", "提示词工程", "内容审核"]),
 ("AI Agent 工作流系统", "cover-mono-top", "刻有电路纹路的黑白蚀刻巨石", "[示例] 业务流程涉及多个系统和重复步骤，希望由智能体协助完成多步骤任务。",
  "[示例] 负责任务拆解、工具调用设计与关键节点的人工确认机制。", "[示例] 流程繁琐、跨系统切换多、结果难以追溯。",
  "[示例] 可视化工作流编排、执行记录与异常兜底（请替换为真实成果）。", "[示例] 流程处理时长缩短 [XX%]，人工介入次数下降 [XX%]。", ["AI Agent", "工具调用", "工作流编排"]),
]

def project_card(p, i):
    name, cover, alt, bg, duty, prob, out, impact, tech = p
    rows = [("项目背景", bg), ("我的职责", duty), ("解决的问题", prob), ("产品成果", out), ("数据或业务影响", impact)]
    dl = "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k, v in rows)
    dl += "<dt>技术 / AI 能力</dt><dd><div class=\"chips-inline\">" + "".join(f'<span class="pill">{t}</span>' for t in tech) + "</div></dd>"
    return f'''<article class="project reveal">
   <div class="thumb">{pic(cover, alt, sizes="(max-width:900px) 100vw, 600px")}</div>
   <div class="project-body"><p class="label"><b>P{i:02d}</b> / PROJECT</p>
    <h3>{name} <small>[示例]</small></h3>
    <dl>{dl}</dl></div></article>'''

OPINIONS = ["AI 产品的核心不是“能不能生成”，而是“能不能帮助用户完成任务”。",
            "好的 AI 体验应该让用户感到可控、可理解、可协作。",
            "产品经理需要同时理解技术边界、用户需求和商业价值。",
            "AI 产品的竞争将从模型能力逐渐转向场景理解和产品体验。"]
SKILLS = ["AI 产品战略", "生成式 AI 产品设计", "AI Agent 与工作流", "用户研究与需求分析", "产品商业化", "跨团队协作"]

def home():
    latest = ARTICLES[:3]
    return head(SITE, DESC, "home", extra='<link rel="preload" as="image" type="image/webp" href="assets/hero.webp">\n') + header("home") + f'''<main id="main">
<!-- ===== HERO ===== -->
<section class="hero" aria-labelledby="hero-title">
 <div class="hero-art feather" aria-hidden="false">{pic("hero", "黑白蚀刻版画风格的夜晚沙漠：层叠的沙丘与远处的高原岩柱，天空中有稀疏的星点", 1280, 720, eager=True, small=False)}</div>
 <div class="wrap">
  <div class="hero-copy">
   <p class="label"><b>00</b> / JINYUAN — AI PRODUCT</p>
   <h1 id="hero-title">{NAME}</h1>
   <p class="role">{ROLE}</p>
   <p class="tag">专注于人工智能产品、用户体验与商业化创新</p>
   <p class="sub">关注 AI 产品设计、智能体、生成式 AI、用户需求与技术落地。</p>
   <div class="hero-actions"><a class="btn btn-primary" href="articles.html">查看我的文章 <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-ghost" href="#contact">联系我</a></div>
  </div>
  <div class="hero-meta"><div class="grid4">
   <div class="cell"><span class="k">方向</span>AI 产品设计</div><div class="cell"><span class="k">关注</span>智能体 · 生成式 AI</div>
   <div class="cell"><span class="k">从业年限</span>1 年</div><div class="cell"><span class="k">状态</span>欢迎交流与合作</div></div></div>
 </div>
</section>

<!-- ===== 01 ABOUT ===== -->
<section class="sec" id="about" aria-labelledby="about-t">
 <div class="wrap">
  {sec_head("01", "ABOUT", '<span id="about-t">关于我</span>')}
  <div class="about-grid">
   <div class="about-text cell reveal">
    <p class="lead">我是{NAME}，一名{ROLE}，从业 1 年，专注于人工智能产品、用户体验与商业化创新。</p>
    <p class="muted">我习惯从真实的用户任务出发，把模型能力翻译成清晰、可落地的产品方案——关注 AI 产品设计、智能体、生成式 AI、用户需求与技术落地，并在产品、技术与业务之间做好协作与取舍。</p>
    <p class="muted">我的工作方向主要集中在 AI 产品从“可演示”走向“可使用、可持续”的过程：需求洞察、体验设计、评估指标与商业化路径。</p>
   </div>
   <figure class="about-fig reveal" style="margin:0">{pic("about-mono", "刻有电路纹路的黑白蚀刻巨石，在黑色背景中被光线照亮", 576, 720, cls="feather-soft", small=False)}</figure>
   <dl class="facts reveal" style="margin:0">
    <div><dt>当前职业</dt><dd>{ROLE}</dd></div><div><dt>工作方向</dt><dd>AI 产品设计 · 智能体</dd></div>
    <div><dt>从业年限</dt><dd>1 年</dd></div><div><dt>关注</dt><dd>生成式 AI · 技术落地</dd></div>
   </dl>
   <ul class="skills reveal" aria-label="擅长领域">{"".join(f'<li><span class="n">{i+1:02d}</span><span>{s}</span></li>' for i, s in enumerate(SKILLS))}</ul>
   <div class="philosophy reveal"><p class="label">工作理念 / PHILOSOPHY</p><blockquote><p>让复杂的 AI 能力，变成真实、易用且可持续的产品体验。</p></blockquote></div>
  </div>
 </div>
</section>

<!-- ===== 02 PROJECTS ===== -->
<section class="sec" id="projects" aria-labelledby="projects-t">
 <div class="wrap">
  {sec_head("02", "PROJECTS", '<span id="projects-t">产品与项目经验</span>', '<span class="eyebrow-note">示例内容，请替换</span><br>以下四个项目均为占位示例，数字以 [XX%] 表示，请替换为你的真实经历。')}
  <div class="projects">{"".join(project_card(p, i + 1) for i, p in enumerate(PROJECTS))}</div>
 </div>
</section>

<!-- ===== 03 ARTICLES ===== -->
<section class="sec" id="articles" aria-labelledby="articles-t">
 <div class="wrap">
  {sec_head("03", "WRITING", '<span id="articles-t">个人文章</span>', "关于 AI 产品、智能体与体验设计的思考与笔记（示例文章）。")}
  <div class="cards3">{"".join(acard(a) for a in latest)}</div>
  <p class="sec-foot reveal"><a class="btn btn-ghost" href="articles.html">查看全部文章 <span class="arr" aria-hidden="true">→</span></a></p>
 </div>
</section>

<!-- ===== 04 OPINIONS ===== -->
<section class="sec" id="opinions" aria-labelledby="opinions-t">
 <div class="wrap">
  {sec_head("04", "OPINIONS", '<span id="opinions-t">我的观点</span>')}
  <div class="op-grid">
   <div class="op-side reveal"><p class="muted">四条我在做 AI 产品时反复回到的判断。</p>
    <figure>{pic("cover-mono-circuit", "布满电路纹路的黑白蚀刻石块细节", cls="feather-soft")}</figure></div>
   <ol class="op-list">{"".join(f'<li class="op reveal"><span class="no">{i+1:02d}</span><p>{t}</p></li>' for i, t in enumerate(OPINIONS))}</ol>
  </div>
 </div>
</section>

<!-- ===== 05 EXPERIENCE ===== -->
<section class="sec" id="experience" aria-labelledby="experience-t">
 <div class="wrap">
  {sec_head("05", "EXPERIENCE", '<span id="experience-t">工作经历</span>', '<span class="eyebrow-note">示例内容，请替换</span>')}
  <div class="tl-wrap">
   <p class="side-note reveal">时间线（由近到远）。请将方括号占位内容替换为真实经历。</p>
   <div class="timeline reveal" style="grid-column:2/5">
    <div class="tl-item"><p class="tl-date">[YYYY.MM — YYYY.MM]</p><h3>[公司名称] <span>/ [职位]</span></h3>
     <dl><dt>负责方向</dt><dd>[负责方向]</dd><dt>代表成果</dt><dd>[代表成果]</dd></dl></div>
    <div class="tl-item"><p class="tl-date">[YYYY.MM — YYYY.MM]</p><h3>[公司名称] <span>/ [职位]</span></h3>
     <dl><dt>负责方向</dt><dd>[负责方向]</dd><dt>代表成果</dt><dd>[代表成果]</dd></dl></div>
   </div>
  </div>
 </div>
</section>

<!-- ===== 06 CONTACT ===== -->
<section class="sec" id="contact" aria-labelledby="contact-t">
 <div class="wrap">
  {sec_head("06", "CONTACT", '<span id="contact-t">联系我</span>')}
  {contact_block()}
 </div>
</section>
</main>
''' + footer() + "</body>\n</html>\n"

def articles_page():
    chips = ['<button type="button" class="chip" data-cat="全部" aria-pressed="true">全部<span class="c">%d</span></button>' % len(ARTICLES)]
    for c in CATEGORIES:
        n = sum(1 for a in ARTICLES if a["category"] == c)
        chips.append(f'<button type="button" class="chip" data-cat="{c}" aria-pressed="false">{c}<span class="c">{n}</span></button>')
    items = []
    for a in ARTICLES:
        search = " ".join([a["title"], a["excerpt"], a["category"], " ".join(a["tags"])])
        tags = "".join(f'<span class="pill">{t}</span>' for t in a["tags"])
        items.append(f'''<li data-date="{a["date"]}" data-cat="{a["category"]}" data-search="{E(search)}">
   <article class="aitem">
    <a class="thumb" href="article.html?slug={a["slug"]}" tabindex="-1" aria-hidden="true"><div>{pic(a["cover"], a["coverAlt"], sizes="(max-width:900px) 100vw, 320px")}</div></a>
    <div class="body">
     <div class="meta"><span class="cat">{a["category"]}</span><span>{fmt(a["date"])}</span><span>阅读约 {a["readTime"]} 分钟</span></div>
     <h2><a href="article.html?slug={a["slug"]}">{E(a["title"])}</a></h2>
     <p>{E(a["excerpt"])}</p>
     <div class="foot"><div class="tags" aria-label="标签">{tags}</div>
      <a class="btn btn-ghost btn-sm" href="article.html?slug={a["slug"]}" aria-label="阅读更多：{E(a["title"])}">阅读更多 <span class="arr" aria-hidden="true">→</span></a></div>
    </div></article></li>''')
    return head("文章｜" + SITE, "李硕金沅的文章：AI 产品经理方法论、生成式 AI 产品设计、AI Agent 产品化、大模型应用实践等（示例文章）。", "articles", jsonld=False) + header("articles") + f'''<main id="main">
 <section class="page-head" aria-labelledby="page-t"><div class="wrap"><div class="cell">
  <p class="label"><b>03</b> / WRITING</p><h1 id="page-t">文章</h1>
  <p class="lead">关于 AI 产品、智能体与体验设计的思考与笔记。可按分类筛选，或输入关键词实时搜索。</p></div></div></section>
 <div class="wrap">
  <div class="toolbar">
   <div class="search"><label class="sr" for="q">搜索文章</label><input id="q" type="search" placeholder="搜索标题、摘要、标签…" autocomplete="off"></div>
   <div class="chips" role="group" aria-label="按分类筛选">{"".join(chips)}</div>
  </div>
  <p class="result-info" id="result-info" role="status" aria-live="polite">共 {len(ARTICLES)} 篇</p>
  <ul class="alist" id="alist">{"".join(items)}</ul>
  <div class="empty" id="empty" hidden><p></p><button type="button" class="btn btn-ghost btn-sm" id="reset">清除筛选</button></div>
 </div>
</main>
''' + footer() + '<script src="js/articles-data.js"></script><script src="js/articles.js" defer></script>\n</body>\n</html>\n'

def article_page():
    return head("文章｜" + SITE, "文章详情", "article", jsonld=False, og_type="article") + header("article", progress=True) + \
        '<main id="main"><div id="article-root"><div class="wrap"><div class="nf"><p class="muted">加载中…（需要启用 JavaScript）</p></div></div></div></main>\n' + footer() + \
        '<script src="js/articles-data.js"></script><script src="js/markdown.js"></script><script src="js/article.js"></script>\n</body>\n</html>\n'

def contact_page():
    return head("联系我｜" + SITE, "联系李硕金沅：邮箱、GitHub、微信，或通过表单留言。", "contact") + header("contact") + f'''<main id="main">
 <section class="page-head" aria-labelledby="page-t"><div class="wrap"><div class="cell">
  <p class="label"><b>06</b> / CONTACT</p><h1 id="page-t">联系我</h1>
  <p class="lead">欢迎交流 AI 产品、智能体与生成式 AI 相关的合作与想法。</p></div></div></section>
 <section class="sec" style="border-top:0" aria-label="联系方式与表单"><div class="wrap">{contact_block()}</div></section>
</main>
''' + footer() + "</body>\n</html>\n"

for name, content in [("index.html", home()), ("articles.html", articles_page()), ("article.html", article_page()), ("contact.html", contact_page())]:
    (ROOT / name).write_text(content, encoding="utf-8")
print("built", len(ARTICLES), "articles; read times:", [a["readTime"] for a in ARTICLES])
