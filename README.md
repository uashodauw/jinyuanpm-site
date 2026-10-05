# JINYUAN｜AI 产品与智能体验 — 个人品牌网站

纯静态站点（HTML / CSS / 原生 JS），无构建步骤、无外部 CDN / 字体依赖。视觉参考 “NOX Grid”：纯黑背景、黑白蚀刻插画、虚线网格与四列页脚。

## 本地预览
```bash
cd site
python3 -m http.server 8000     # 然后打开 http://localhost:8000
```
> 直接双击打开 `index.html` 也基本可用，但建议使用静态服务器。

## 页面
| 文件 | 说明 |
|---|---|
| `index.html` | 首页：Hero / 关于我 / 项目经验 / 文章 / 观点 / 工作经历 / 联系 / 页脚 |
| `articles.html` | 文章列表：分类筛选、实时关键词搜索（支持 `?cat=分类名`、`?q=关键词`） |
| `article.html?slug=…` | 文章详情模板（目录、阅读进度、代码复制、相关文章、分享、上下篇） |
| `contact.html` | 独立联系页（与首页联系区块一致） |

## 目录结构
```
css/style.css          全部样式（设计变量在 :root）
js/main.js             导航、滚动淡入、复制、联系表单校验
js/articles.js         文章列表筛选 / 搜索
js/article.js          文章详情渲染（读取 articles-data.js）
js/markdown.js         轻量 Markdown 渲染器
js/articles-data.js    文章数据（由 tools/articles/*.md 生成，也可手动编辑）
assets/                蚀刻图（jpg + webp，均 < 400KB）
tools/build.py         可选：重新生成 HTML 与 articles-data.js（python3 tools/build.py）
tools/articles/*.md    示例文章源文件
```

## 需要替换的占位内容（请逐项检查）
1. **邮箱**：当前按提供原样使用 `shuojinyuanli@gmail.com` —— **看起来不完整（可能缺少 `.com`）**，请确认后全局替换（`index.html`、`contact.html`、页脚、表单 `data-mailto`；或修改 `tools/build.py` 里的 `EMAIL` 后重新运行）。
2. **公众号 / 社交媒体**：`[链接]`（首页联系区、`contact.html`、页脚；页脚中该链接目前是禁用占位）。
3. **项目经验**（首页 4 个卡片）：全部为 `[示例]` 文案与 `[XX%]` 数字，需换成真实项目、职责、成果和数据。页面上有“示例内容，请替换”标注，替换后请删除。
4. **工作经历**：`[公司名称]` `[职位]` `[YYYY.MM — YYYY.MM]` `[负责方向]` `[代表成果]`（2 条占位，可增删）。
5. **个人简介 / 关于我**：文案基于已提供的信息概括撰写，请改成你自己的介绍。
6. **示例文章**：5 篇文章均为示例（页面底部有“示例文章”标注），请改写或替换为原创内容；日期为 2026 年的示例日期。编辑 `tools/articles/*.md` 后运行 `python3 tools/build.py`，或直接修改 `js/articles-data.js` 与 `articles.html`。
7. **OG / 分享图与站点 URL**：`<meta property="og:image" content="assets/og.jpg">` 为相对路径；部署后请改成绝对地址（如 `https://你的域名/assets/og.jpg`），并按需补充 `og:url` 与 JSON-LD 中的 `url`。
8. 页脚版权所有人（`李硕金沅 / JINYUAN`）与年份（自动取当前年份）。

## 联系表单如何接入后端
`#contact-form` 默认**无后端**：校验通过后用 `mailto:` 打开访客邮件客户端，并显示成功提示。
要真正收信：给 `<form>` 的 `data-endpoint` 填上 Formspree（`https://formspree.io/f/xxxxxxx`）、Getform 或自有接口地址即可，脚本会以 JSON POST `{name,email,message}`。详见 `index.html` / `contact.html` 中的注释与 `js/main.js`。

## 部署
- **GitHub Pages**：把 `site/` 内容推送到仓库（根目录或 `docs/`），Settings → Pages 选择分支即可。所有链接均为相对路径，子路径（`/repo-name/`）下可用。
- **Netlify / Vercel / Cloudflare Pages**：Netlify 直接把 `site` 文件夹拖到 https://app.netlify.com/drop ；其他平台选择“无构建命令，输出目录为 `site`”。
- 任意静态主机 / Nginx 也可，无需服务端逻辑。

## 如何添加一篇新文章
1. 在 `tools/articles/` 新增 `.md`（参考现有文件的 front-matter：slug / title / category / tags / date / cover / cover_alt / excerpt）。
2. 运行 `python3 tools/build.py`（阅读时间按正文字数自动计算：约 400 字/分钟）。
3. 支持：`##` / `###` 标题（自动生成目录）、`>` 引用、``` 代码块（带复制按钮）、`- [ ]` 清单、`![alt](assets/x.jpg "图注")` 图片、`**粗体**`、`` `行内代码` ``、链接。

## 图片
`assets/` 中的蚀刻图由原图裁剪而来（`hero`、`monolith`、`about-mono`、`footer-art`、`cover-*`，每张均含 `.jpg` 与 `.webp`，封面另有 `-sm` 小图）。页面用 `<picture>` + `loading="lazy"`（首屏图除外）。

## 无障碍 / 性能
跳转链接、语义化标签、键盘可用的菜单与筛选、可见焦点、`aria-live` 结果提示、`prefers-reduced-motion` 支持；仅系统字体、无第三方请求。
