from PIL import Image, ImageDraw
import numpy as np, json, os
info=json.load(open('/tmp/cutinfo.json'))
R={'1-panel.png':34}
OUT='/workspace/desktidy/cut'; S=4
for fn,d in info.items():
    im=Image.open('/workspace/desktidy/raw/'+fn).convert('RGB')
    x0,y0,x1,y1=d['bbox']; pad=0; x0-=pad;y0-=pad;x1+=pad;y1+=pad
    w,h=x1-x0+1,y1-y0+1; r=R.get(fn,43)
    m=Image.new('L',(w*S,h*S),0); ImageDraw.Draw(m).rounded_rectangle([0,0,w*S-1,h*S-1],radius=r*S,fill=255)
    m=m.resize((w,h),Image.LANCZOS)
    c=im.crop((x0,y0,x1+1,y1+1)).convert('RGBA'); c.putalpha(m)
    name=fn.replace('.png','')
    c.save(f'{OUT}/{name}.webp','WEBP',quality=88,method=6,alpha_quality=100)
    c.save(f'/tmp/cut-{name}.png')
    print(name,c.size,os.path.getsize(f'{OUT}/{name}.webp')//1024,'KB')
# sheet on checkerboard, plus corner zooms on dark & checker
ims=[Image.open(f'/tmp/cut-{n}.png') for n in ['1-panel','2-focus','3-scenes','4-clean','5-shortcuts']]
def checker(w,h,s=16):
    a=(np.indices((h,w))//s).sum(0)%2; arr=np.where(a[...,None]==1,[200,200,200],[245,245,245]).astype('uint8'); return Image.fromarray(arr).convert('RGBA')
W=sum(i.width for i in ims)+40*6; H=max(i.height for i in ims)+80
sh=checker(W,H); x=40
for i in ims: sh.alpha_composite(i,(x,40)); x+=i.width+40
sh.convert('RGB').save('/tmp/sheet.png')
# corner zooms: 4 corners of each, 3x, on red background to reveal leftovers
tiles=[]
for i in ims:
    bg=Image.new('RGBA',i.size,(255,0,80,255)); bg.alpha_composite(i)
    w,h=i.size; z=70
    for (cx,cy) in [(0,0),(w-z,0),(0,h-z),(w-z,h-z)]:
        tiles.append(bg.crop((cx,cy,cx+z,cy+z)).resize((z*3,z*3),Image.NEAREST))
T=Image.new('RGB',(4*210+50,5*210+60),(30,30,30))
for k,t in enumerate(tiles): T.paste(t,(10+(k%4)*212,10+(k//4)*212))
T.save('/tmp/corners.png')
