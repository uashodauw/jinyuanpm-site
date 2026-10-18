from PIL import Image, ImageDraw
import numpy as np, glob, os, sys, json
res={}
for f in sorted(glob.glob('/workspace/desktidy/raw/*.png')):
    im=Image.open(f).convert('RGB'); a=np.array(im).astype(int); H,W,_=a.shape
    r,g,b=a[...,0],a[...,1],a[...,2]
    M=((b-r)>=7)&(r>150)&(b>225)
    col=M.sum(0); row=M.sum(1)
    cols=np.where(col>0.55*col.max())[0]; rows=np.where(row>0.55*row.max())[0]
    x0,x1,y0,y1=cols.min(),cols.max(),rows.min(),rows.max()
    # estimate radius: at row y0+k leftmost mask pixel within [x0, x0+120]
    ks=[];
    for k in range(0,60):
        rr=M[y0+k, x0:x0+150]; idx=np.where(rr)[0]
        ks.append(int(idx[0]) if len(idx) else 150)
    res[os.path.basename(f)]=dict(bbox=[int(x0),int(y0),int(x1),int(y1)],left=ks[:40])
    print(os.path.basename(f),W,H,'bbox',x0,y0,x1,y1,'leftoff',ks[:40:2])
json.dump(res,open('/tmp/cutinfo.json','w'))
