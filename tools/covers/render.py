import sys,os,asyncio,json,re,glob,io
sys.path.insert(0,'/workspace/codecovers')
from lib import S
import designs
from PIL import Image
from playwright.async_api import async_playwright
SITE='/workspace/jinyuanpm-site'
jobs=[]
for slug,f in designs.COVERS.items():
    s=S(); f(s); jobs.append((f'{SITE}/assets/articles/{slug}/cv',1600,900,s))
for (slug,n),f in designs.B.items():
    p=f'{SITE}/assets/articles/{slug}/fig-{n:02d}.webp'; w,h=Image.open(p).size
    s=S(1600,round(1600*h/w),zoom=1.12 if h/w>0.5 else 1.0); f(s); s.label=''; jobs.append((p[:-5],w,h,s))
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-proxy-server'])
        pg=await b.new_page(viewport={'width':1600,'height':1600})
        for base,w,h,s in jobs:
            await pg.set_viewport_size({'width':s.W,'height':s.H})
            await pg.set_content(f'<html><body style="margin:0;background:#05060d">{s.svg()}</body></html>')
            png=await pg.screenshot(clip={'x':0,'y':0,'width':s.W,'height':s.H})
            im=Image.open(io.BytesIO(png)).convert('RGB')
            if base.endswith('/cv'):
                im.save(base+'.webp','WEBP',quality=82,method=6)
                im.resize((640,360),Image.LANCZOS).save(base+'-sm.webp','WEBP',quality=80,method=6)
            else:
                im.resize((w,h),Image.LANCZOS).save(base+'.webp','WEBP',quality=82,method=6)
        await b.close()
asyncio.run(main()); print('rendered',len(jobs))
