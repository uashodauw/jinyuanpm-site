"""Builds api/knowledge.json (compact plain text of the site) for the chat assistant in api/chat.js.
Re-run after changing page content or articles:  python3 tools/build-knowledge.py"""
import json, re, os
from bs4 import BeautifulSoup
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES=[('about.html','关于'),('experience.html','经历'),('projects.html','项目列表'),('project-agents-pro.html','项目详情：AgentsPro'),('project-pixeling.html','项目详情：Pixeling 千象'),
('project-desktidy.html','项目详情：DeskTidy'),('tools.html','常用工具'),('contact.html','联系方式')]
def clean(t): return re.sub(r'[ \t\u00a0]+',' ',re.sub(r'\n\s*\n+','\n',t)).strip()
def page_text(fn):
    s=BeautifulSoup(open(os.path.join(ROOT,fn),encoding='utf-8').read(),'html.parser')
    m=s.find('main') or s.body
    for x in m.select('script,style,svg,noscript,.pd-foot,.pd-back,picture,img,.guides'): x.decompose()
    for a in m.find_all('a',href=True):
        h=a['href']
        if h.startswith(('mailto:','http')) and h not in a.get_text(): a.append(f' ({h.replace("mailto:","")})')
    out=[]
    for el in m.find_all(['h1','h2','h3','p','li','dt','dd','figcaption','b','span'],recursive=True):
        if el.find(['p','li','h2','h3','dd','dt']): continue
        if el.name in('b','span') and el.find_parent(['p','li','h1','h2','h3','dd','dt','figcaption']): continue
        t=clean(el.get_text(' ')).replace(' 复制','')
        if not t or t in('→','复制') or t.endswith('↗') or t.startswith(('查看项目详情','注：','带 * 为必填','公众号 / 社交')) or '[链接]' in t: continue
        if not out or out[-1]!=t: out.append(t)
    return '\n'.join(out)
def contact_extra():
    s=BeautifulSoup(open(os.path.join(ROOT,'contact.html'),encoding='utf-8').read(),'html.parser')
    links=sorted({a['href'] for a in s.find_all('a',href=True) if a['href'].startswith(('mailto:','https://github','https://x.com','https://www.linkedin'))})
    return links
def articles():
    js=open(os.path.join(ROOT,'js/articles-data.js'),encoding='utf-8').read()
    data=json.loads(js[js.index('['):js.rindex(']')+1])
    out=[]
    for a in data:
        c=re.sub(r'!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?','',a['content'])
        c=re.sub(r'\*\*|__|`','',c); c=re.sub(r'^\|.*$','',c,flags=re.M)
        heads=re.findall(r'^#{2,3}\s*(.+)$',c,flags=re.M)
        paras=[p.strip() for p in re.split(r'\n\s*\n',re.sub(r'^#{1,6}.*$','',c,flags=re.M)) if len(p.strip())>20]
        body=''
        for p in paras:
            if len(body)+len(p)>520: break
            body+=p+'\n'
        out.append({'title':a['title'],'date':a['date'],'category':a['category'],'url':'https://jinyuanpm.com/article.html?slug='+a['slug'],
                    'summary':a['excerpt'],'sections':heads[:14],'key_text':body.strip()})
    return out
K={'person':'李硕金沅（JinYuan），AI 产品经理。网站 https://jinyuanpm.com',
   'pages':[{'page':t,'url':'https://jinyuanpm.com/'+f,'text':page_text(f)} for f,t in PAGES],
   'contact_links':contact_extra(),'articles':articles()}
p=os.path.join(ROOT,'api/knowledge.json'); json.dump(K,open(p,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('wrote',p,os.path.getsize(p),'bytes', sum(len(x['text']) for x in K['pages']),'page chars', len(K['articles']),'articles')
