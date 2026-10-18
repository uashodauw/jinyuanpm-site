"""Code-drawn article figures in the site's own palette (css/style.css :root dark theme)."""
import math
BG='#05060d'; CARD='#0a0b17'; A='#5ef8c5'; A2='#3ddc97'; LINE='rgba(170,230,210,.22)'; NEU='rgba(214,226,222,.5)'; DIM='#8e94a3'
class S:
    def __init__(s,W=1600,H=900,label='',seed=0,glow=(1000,450),zoom=1.0):
        s.W,s.H=W,H; s.zoom=zoom; s.oy=(H-900)/2; s.el=[]; s.label=label; s.glow=glow
    def add(s,x): s.el.append(x)
    def y(s,v): return v+s.oy
    # ---------- primitives (coords in a 1600x900 design box, vertically centred) ----------
    def panel(s,x,y,w,h,r=14,fill=CARD,stroke=LINE,sw=1.5,op=1):
        s.add(f'<rect x="{x}" y="{s.y(y)}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>')
    def line(s,x1,y1,x2,y2,c=NEU,sw=2,dash=None,op=1,glow=False):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        s.add(f'<line x1="{x1}" y1="{s.y(y1)}" x2="{x2}" y2="{s.y(y2)}" stroke="{c}" stroke-width="{sw}" stroke-linecap="round"{d} opacity="{op}"{" filter=\"url(#g)\"" if glow else ""}/>')
    def path(s,d,c=A,sw=2.4,fill='none',glow=True,op=1,dash=None):
        dd=f' stroke-dasharray="{dash}"' if dash else ''
        s.add(f'<path d="{d}" transform="translate(0 {s.oy})" fill="{fill}" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}"{dd}{" filter=\"url(#g)\"" if glow else ""}/>')
    def circle(s,cx,cy,r,c=A,sw=2.4,fill='none',glow=True,op=1,dash=None):
        dd=f' stroke-dasharray="{dash}"' if dash else ''
        s.add(f'<circle cx="{cx}" cy="{s.y(cy)}" r="{r}" fill="{fill}" stroke="{c}" stroke-width="{sw}" opacity="{op}"{dd}{" filter=\"url(#g)\"" if glow else ""}/>')
    def dot(s,cx,cy,r=5,c=A,op=1): s.add(f'<circle cx="{cx}" cy="{s.y(cy)}" r="{r}" fill="{c}" opacity="{op}" filter="url(#g)"/>')
    def arrow(s,x1,y1,x2,y2,c=A,sw=2.2,dash=None,op=.9):
        dd=f' stroke-dasharray="{dash}"' if dash else ''
        s.add(f'<line x1="{x1}" y1="{s.y(y1)}" x2="{x2}" y2="{s.y(y2)}" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" marker-end="url(#ar)"{dd} opacity="{op}"/>')
    def curve(s,x1,y1,x2,y2,bend=0.0,c=A,sw=2.2,dash=None,op=.9,arrowhead=True):
        mx,my=(x1+x2)/2,(y1+y2)/2; nx,ny=-(y2-y1),(x2-x1); cx,cy=mx+nx*bend,my+ny*bend
        dd=f' stroke-dasharray="{dash}"' if dash else ''
        s.add(f'<path d="M{x1} {s.y(y1)} Q{cx} {s.y(cy)} {x2} {s.y(y2)}" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round"{" marker-end=\"url(#ar)\"" if arrowhead else ""}{dd} opacity="{op}"/>')
    # ---------- motifs ----------
    def doc(s,x,y,w,h,lines=5,checks=0,hl=None):
        s.panel(x,y,w,h,12)
        s.path(f'M{x+w-34} {y} L{x+w} {y+34}',c=LINE,sw=1.5,glow=False)
        s.line(x+28,y+40,x+w*0.55,y+40,c=A,sw=4,op=.85)
        gap=(h-90)/max(lines,1)
        for i in range(lines):
            yy=y+80+i*gap; x0=x+28
            if i<checks:
                s.add(f'<rect x="{x0}" y="{s.y(yy-9)}" width="18" height="18" rx="4" fill="none" stroke="{A}" stroke-width="2" opacity=".9"/>')
                s.path(f'M{x0+4} {yy} l4 5 l7 -9',sw=2.2,glow=False); x0+=32
            ln=w-28-(x0-x)-(30 if i%2 else 70)
            s.line(x0,yy,x0+ln,yy,c=A if hl==i else NEU,sw=3 if hl==i else 2.4,op=.95 if hl==i else .55)
    def node(s,cx,cy,r=44,icon=None,solid=False):
        s.circle(cx,cy,r+14,c=A,sw=1,op=.18,glow=False)
        s.circle(cx,cy,r,c=A,sw=2.4,fill=CARD)
        if solid: s.circle(cx,cy,r*.38,c=A,sw=0,fill=A,op=.85)
        if icon: s.icon(icon,cx,cy,r*.5)
    def icon(s,k,cx,cy,r):
        y=s.y(cy)
        if k=='target':
            for f in (1,.6,.22): s.add(f'<circle cx="{cx}" cy="{y}" r="{r*f}" fill="none" stroke="{A}" stroke-width="2.2"/>')
        elif k=='eye':
            s.add(f'<path d="M{cx-r} {y} Q{cx} {y-r*.9} {cx+r} {y} Q{cx} {y+r*.9} {cx-r} {y}Z" fill="none" stroke="{A}" stroke-width="2.2"/><circle cx="{cx}" cy="{y}" r="{r*.32}" fill="{A}"/>')
        elif k=='bolt':
            s.add(f'<path d="M{cx+r*.2} {y-r} L{cx-r*.5} {y+r*.1} L{cx} {y+r*.1} L{cx-r*.2} {y+r} L{cx+r*.5} {y-r*.1} L{cx} {y-r*.1}Z" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/>')
        elif k=='db':
            s.add(f'<ellipse cx="{cx}" cy="{y-r*.6}" rx="{r*.8}" ry="{r*.28}" fill="none" stroke="{A}" stroke-width="2.2"/><path d="M{cx-r*.8} {y-r*.6} V{y+r*.6} A{r*.8} {r*.28} 0 0 0 {cx+r*.8} {y+r*.6} V{y-r*.6} M{cx-r*.8} {y} A{r*.8} {r*.28} 0 0 0 {cx+r*.8} {y}" fill="none" stroke="{A}" stroke-width="2.2"/>')
        elif k=='gear':
            pts=[]
            for i in range(16):
                a=i*math.pi/8; rr=r if i%2==0 else r*.72
                pts.append(f'{cx+rr*math.cos(a):.1f},{y+rr*math.sin(a):.1f}')
            s.add(f'<polygon points="{" ".join(pts)}" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="{cx}" cy="{y}" r="{r*.3}" fill="none" stroke="{A}" stroke-width="2.2"/>')
        elif k=='search':
            s.add(f'<circle cx="{cx-r*.15}" cy="{y-r*.15}" r="{r*.6}" fill="none" stroke="{A}" stroke-width="2.4"/><line x1="{cx+r*.3}" y1="{y+r*.3}" x2="{cx+r*.85}" y2="{y+r*.85}" stroke="{A}" stroke-width="2.8" stroke-linecap="round"/>')
        elif k=='shield':
            s.add(f'<path d="M{cx} {y-r} L{cx+r*.85} {y-r*.6} V{y+r*.05} Q{cx+r*.8} {y+r*.75} {cx} {y+r} Q{cx-r*.8} {y+r*.75} {cx-r*.85} {y+r*.05} V{y-r*.6}Z" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/><path d="M{cx-r*.35} {y} l{r*.25} {r*.28} l{r*.45} {-r*.55}" fill="none" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')
        elif k=='headset':
            s.add(f'<path d="M{cx-r*.8} {y+r*.2} V{y} A{r*.8} {r*.8} 0 0 1 {cx+r*.8} {y} V{y+r*.2}" fill="none" stroke="{A}" stroke-width="2.4"/><rect x="{cx-r*.95}" y="{y}" width="{r*.35}" height="{r*.6}" rx="5" fill="none" stroke="{A}" stroke-width="2.2"/><rect x="{cx+r*.6}" y="{y}" width="{r*.35}" height="{r*.6}" rx="5" fill="none" stroke="{A}" stroke-width="2.2"/><path d="M{cx+r*.78} {y+r*.6} Q{cx+r*.7} {y+r} {cx+r*.1} {y+r}" fill="none" stroke="{A}" stroke-width="2"/>')
        elif k=='memory':
            s.add(f'<rect x="{cx-r*.75}" y="{y-r*.75}" width="{r*1.5}" height="{r*1.5}" rx="6" fill="none" stroke="{A}" stroke-width="2.2"/>'+''.join(f'<line x1="{cx-r*.75+r*.3*i}" y1="{y-r}" x2="{cx-r*.75+r*.3*i}" y2="{y-r*.75}" stroke="{A}" stroke-width="2"/><line x1="{cx-r*.75+r*.3*i}" y1="{y+r*.75}" x2="{cx-r*.75+r*.3*i}" y2="{y+r}" stroke="{A}" stroke-width="2"/>' for i in range(1,5))+f'<rect x="{cx-r*.3}" y="{y-r*.3}" width="{r*.6}" height="{r*.6}" rx="3" fill="{A}" opacity=".8"/>')
        elif k=='chat':
            s.add(f'<path d="M{cx-r} {y-r*.6} H{cx+r} V{y+r*.4} H{cx-r*.2} L{cx-r*.6} {y+r*.85} V{y+r*.4} H{cx-r}Z" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/>'+''.join(f'<circle cx="{cx+dx*r*.45}" cy="{y-r*.1}" r="{r*.1}" fill="{A}"/>' for dx in(-1,0,1)))
        elif k=='check':
            s.add(f'<path d="M{cx-r*.6} {y} l{r*.4} {r*.45} l{r*.8} {-r*.9}" fill="none" stroke="{A}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
        elif k=='lock':
            s.add(f'<rect x="{cx-r*.7}" y="{y-r*.1}" width="{r*1.4}" height="{r*1.05}" rx="5" fill="none" stroke="{A}" stroke-width="2.2"/><path d="M{cx-r*.42} {y-r*.1} V{y-r*.45} A{r*.42} {r*.42} 0 0 1 {cx+r*.42} {y-r*.45} V{y-r*.1}" fill="none" stroke="{A}" stroke-width="2.2"/>')
        elif k=='doc':
            s.add(f'<path d="M{cx-r*.6} {y-r*.85} H{cx+r*.25} L{cx+r*.65} {y-r*.45} V{y+r*.85} H{cx-r*.6}Z" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/>'+''.join(f'<line x1="{cx-r*.35}" y1="{y-r*.2+i*r*.3}" x2="{cx+r*.4}" y2="{y-r*.2+i*r*.3}" stroke="{A}" stroke-width="2"/>' for i in range(3)))
        elif k=='flag':
            s.add(f'<path d="M{cx-r*.5} {y+r} V{y-r} M{cx-r*.5} {y-r} H{cx+r*.7} L{cx+r*.4} {y-r*.55} L{cx+r*.7} {y-r*.1} H{cx-r*.5}" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/>')
        elif k=='sparkle':
            s.add(f'<path d="M{cx} {y-r} Q{cx+r*.12} {y-r*.12} {cx+r} {y} Q{cx+r*.12} {y+r*.12} {cx} {y+r} Q{cx-r*.12} {y+r*.12} {cx-r} {y} Q{cx-r*.12} {y-r*.12} {cx} {y-r}Z" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/>')
        elif k=='cube':
            s.add(f'<path d="M{cx} {y-r} L{cx+r*.87} {y-r*.5} V{y+r*.5} L{cx} {y+r} L{cx-r*.87} {y+r*.5} V{y-r*.5}Z M{cx-r*.87} {y-r*.5} L{cx} {y} L{cx+r*.87} {y-r*.5} M{cx} {y} V{y+r}" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/>')
        elif k=='car':
            s.add(f'<path d="M{cx-r} {y+r*.25} V{y-r*.05} L{cx-r*.6} {y-r*.15} L{cx-r*.3} {y-r*.5} H{cx+r*.35} L{cx+r*.65} {y-r*.15} L{cx+r} {y-r*.05} V{y+r*.25}Z" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="{cx-r*.55}" cy="{y+r*.3}" r="{r*.2}" fill="{CARD}" stroke="{A}" stroke-width="2.2"/><circle cx="{cx+r*.55}" cy="{y+r*.3}" r="{r*.2}" fill="{CARD}" stroke="{A}" stroke-width="2.2"/>')
        elif k=='calendar':
            s.add(f'<rect x="{cx-r*.8}" y="{y-r*.65}" width="{r*1.6}" height="{r*1.5}" rx="6" fill="none" stroke="{A}" stroke-width="2.2"/><line x1="{cx-r*.8}" y1="{y-r*.2}" x2="{cx+r*.8}" y2="{y-r*.2}" stroke="{A}" stroke-width="2"/><line x1="{cx-r*.4}" y1="{y-r*.9}" x2="{cx-r*.4}" y2="{y-r*.45}" stroke="{A}" stroke-width="2.4" stroke-linecap="round"/><line x1="{cx+r*.4}" y1="{y-r*.9}" x2="{cx+r*.4}" y2="{y-r*.45}" stroke="{A}" stroke-width="2.4" stroke-linecap="round"/>'+''.join(f'<rect x="{cx-r*.5+i*r*.38}" y="{y+r*.05+j*r*.32}" width="{r*.18}" height="{r*.16}" rx="2" fill="{A}" opacity="{.9 if (i,j)==(1,0) else .4}"/>' for i in range(3) for j in range(2)))
        elif k=='mail':
            s.add(f'<rect x="{cx-r*.85}" y="{y-r*.55}" width="{r*1.7}" height="{r*1.1}" rx="5" fill="none" stroke="{A}" stroke-width="2.2"/><path d="M{cx-r*.8} {y-r*.45} L{cx} {y+r*.12} L{cx+r*.8} {y-r*.45}" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round"/>')
        elif k=='card':
            s.add(f'<rect x="{cx-r*.9}" y="{y-r*.6}" width="{r*1.8}" height="{r*1.2}" rx="7" fill="none" stroke="{A}" stroke-width="2.2"/><line x1="{cx-r*.9}" y1="{y-r*.25}" x2="{cx+r*.9}" y2="{y-r*.25}" stroke="{A}" stroke-width="3"/><line x1="{cx-r*.6}" y1="{y+r*.25}" x2="{cx-r*.1}" y2="{y+r*.25}" stroke="{A}" stroke-width="2.2" stroke-linecap="round"/>')
        elif k=='home':
            s.add(f'<path d="M{cx-r*.9} {y-r*.05} L{cx} {y-r*.85} L{cx+r*.9} {y-r*.05} M{cx-r*.65} {y-r*.25} V{y+r*.8} H{cx+r*.65} V{y-r*.25}" fill="none" stroke="{A}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><rect x="{cx-r*.2}" y="{y+r*.25}" width="{r*.4}" height="{r*.55}" rx="2" fill="none" stroke="{A}" stroke-width="2"/>')
        elif k=='user':
            s.add(f'<circle cx="{cx-r*.15}" cy="{y-r*.38}" r="{r*.32}" fill="none" stroke="{A}" stroke-width="2.2"/><path d="M{cx-r*.8} {y+r*.75} Q{cx-r*.75} {y+r*.05} {cx-r*.15} {y+r*.05} Q{cx+r*.3} {y+r*.05} {cx+r*.42} {y+r*.35}" fill="none" stroke="{A}" stroke-width="2.2" stroke-linecap="round"/><path d="M{cx+r*.2} {y+r*.62} l{r*.22} {r*.24} l{r*.45} {-r*.5}" fill="none" stroke="{A}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')
    def chat(s,x,y,w,h,side='l',lines=2,accent=False):
        t=f'L{x+30} {y+h+22} L{x+50} {y+h}' if side=='l' else f'L{x+w-30} {y+h+22} L{x+w-50} {y+h}'
        d=(f'M{x+14} {y} H{x+w-14} Q{x+w} {y} {x+w} {y+14} V{y+h-14} Q{x+w} {y+h} {x+w-14} {y+h} '
           + (f'H{x+50} L{x+30} {y+h+22} L{x+30} {y+h} H{x+14}' if side=='l' else f'H{x+w-30} L{x+w-30} {y+h+22} L{x+w-50} {y+h} H{x+14}')
           + f' Q{x} {y+h} {x} {y+h-14} V{y+14} Q{x} {y} {x+14} {y}Z')
        s.add(f'<path d="{d}" transform="translate(0 {s.oy})" fill="{CARD}" stroke="{A if accent else LINE}" stroke-width="{2 if accent else 1.5}" {"filter=\"url(#g)\"" if accent else ""}/>')
        for i in range(lines):
            s.line(x+24,y+28+i*24,x+w-24-(60 if i==lines-1 else 0),y+28+i*24,c=A if accent and i==0 else NEU,sw=2.4,op=.8 if accent and i==0 else .5)
    def car(s,cx,cy,sc=1.0):
        k=sc; p=lambda a,b:f'{cx+a*k:.1f} {cy+b*k:.1f}'
        s.path(f'M{p(-260,40)} L{p(-260,-10)} Q{p(-250,-40)} {p(-200,-48)} L{p(-120,-58)} L{p(-60,-118)} Q{p(-40,-130)} {p(0,-130)} L{p(110,-130)} Q{p(150,-128)} {p(170,-100)} L{p(210,-55)} Q{p(262,-45)} {p(268,0)} L{p(268,40)} Z',sw=2.6)
        s.path(f'M{p(-100,-58)} L{p(-48,-110)} L{p(40,-110)} L{p(40,-58)} Z M{p(62,-58)} L{p(62,-110)} L{p(140,-110)} L{p(180,-58)} Z',c=NEU,sw=1.8,glow=False)
        for wx in (-150,160):
            s.circle(cx+wx*k,cy+40*k,46*k,c=A,sw=2.6,fill=BG); s.circle(cx+wx*k,cy+40*k,16*k,c=NEU,sw=2,glow=False)
        s.line(cx-300*k,cy+86*k,cx+310*k,cy+86*k,c=LINE,sw=1.5)
    def gauge(s,cx,cy,r,frac=.72):
        a0,a1=math.pi*1.15,math.pi*-0.15
        def pt(a,rr): return cx+rr*math.cos(a), cy-rr*math.sin(a)
        x0,y0=pt(a0,r); x1,y1=pt(a1,r); s.path(f'M{x0:.1f} {y0:.1f} A{r} {r} 0 1 1 {x1:.1f} {y1:.1f}',c=LINE,sw=12,glow=False)
        af=a0+(a1-a0)*frac; xf,yf=pt(af,r); s.path(f'M{x0:.1f} {y0:.1f} A{r} {r} 0 {1 if frac>.6 else 0} 1 {xf:.1f} {yf:.1f}',sw=12)
        for i in range(11):
            a=a0+(a1-a0)*i/10; xa,ya=pt(a,r-24); xb,yb=pt(a,r-36); s.line(xa,ya,xb,yb,c=NEU,sw=2,op=.6)
        xn,yn=pt(af,r-50); s.line(cx,cy,xn,yn,c=A,sw=3,glow=True); s.circle(cx,cy,10,c=A,fill=CARD)
    def bars(s,x,y,w,vals,gap=46,h=14):
        for i,v in enumerate(vals):
            yy=y+i*gap; s.add(f'<rect x="{x}" y="{s.y(yy)}" width="{w}" height="{h}" rx="{h/2}" fill="rgba(255,255,255,.05)" stroke="{LINE}"/>')
            s.add(f'<rect x="{x}" y="{s.y(yy)}" width="{w*v:.0f}" height="{h}" rx="{h/2}" fill="{A}" opacity="{.35+.5*v:.2f}"/>')
            s.dot(x-26,yy+h/2,4,c=NEU,op=.7)
    def timeline(s,x,y,w,n=13,active=13,tall=()):
        s.line(x,y,x+w,y,c=LINE,sw=2)
        s.line(x,y,x+w*(active-1)/(n-1),y,c=A,sw=2.6,glow=True)
        for i in range(n):
            xx=x+w*i/(n-1); big=i in tall
            s.line(xx,y-(26 if big else 14),xx,y+(26 if big else 14),c=A if i<active else NEU,sw=2.4 if big else 2,op=.95 if i<active else .5)
            if big: s.circle(xx,y,9,c=A,fill=CARD)
    def window(s,x,y,w,h,bar=True):
        s.panel(x,y,w,h,14)
        if bar:
            s.line(x,y+38,x+w,y+38,c=LINE,sw=1.5)
            for i in range(3): s.circle(x+24+i*20,y+19,5,c=NEU,sw=1.5,glow=False,op=.6)
    def code(s,x,y,rows,w=420,hl=(2,)):
        ind=[0,1,2,2,1,2,3,1,0]
        for i in range(rows):
            l=ind[i%len(ind)]*30; ln=[180,240,150,280,200,120,230,170,90][i%9]*w/420
            s.line(x+l,y+i*30,x+l+ln,y+i*30,c=A if i in hl else NEU,sw=3,op=.9 if i in hl else .45)
    def brackets(s,cx,cy,r=120):
        s.path(f'M{cx-r*.55} {cy-r} L{cx-r*1.15} {cy} L{cx-r*.55} {cy+r}',sw=5); s.path(f'M{cx+r*.55} {cy-r} L{cx+r*1.15} {cy} L{cx+r*.55} {cy+r}',sw=5)
        s.path(f'M{cx+r*.18} {cy-r*.8} L{cx-r*.18} {cy+r*.8}',c=NEU,sw=4,glow=False)
    def cursor(s,x,y,h=56): s.add(f'<rect x="{x}" y="{s.y(y-h/2)}" width="7" height="{h}" fill="{A}" filter="url(#g)"><animate attributeName="opacity" values="1"/></rect>')
    def branch(s,x,y,w):
        s.line(x,y,x+w,y,c=A,sw=3,glow=True)
        s.path(f'M{x+w*.18} {y} C{x+w*.28} {y} {x+w*.26} {y-110} {x+w*.38} {y-110} H{x+w*.62} C{x+w*.74} {y-110} {x+w*.72} {y} {x+w*.82} {y}',c=NEU,sw=2.4,glow=False)
        for f in (0,.18,.5,.82,1): s.circle(x+w*f,y,13,c=A,fill=CARD)
        for f in (.38,.62): s.circle(x+w*f,y-110,11,c=NEU,fill=CARD,glow=False)
    def globe(s,cx,cy,r):
        s.circle(cx,cy,r,sw=2.6,fill=CARD)
        for f in (.45,.8): s.add(f'<ellipse cx="{cx}" cy="{s.y(cy)}" rx="{r*f}" ry="{r}" fill="none" stroke="{NEU}" stroke-width="1.6" opacity=".6"/>')
        for f in (-.5,0,.5): s.add(f'<ellipse cx="{cx}" cy="{s.y(cy+r*f)}" rx="{r*math.sqrt(1-f*f)}" ry="{r*.12}" fill="none" stroke="{NEU}" stroke-width="1.4" opacity=".5"/>')
    def tri(s,cx,cy,r): s.path(f'M{cx} {cy-r} L{cx+r*1.0} {cy+r*.72} L{cx-r*1.0} {cy+r*.72}Z',sw=3)
    def layers(s,cx,cy,w,n=3,gap=34):
        for i in range(n)[::-1]:
            yy=cy+i*gap; op=1 if i==0 else .55
            s.path(f'M{cx} {yy-w*.28} L{cx+w/2} {yy} L{cx} {yy+w*.28} L{cx-w/2} {yy}Z',c=A if i==0 else NEU,sw=2.2,fill=CARD,glow=i==0,op=op)
    def imgframe(s,x,y,w,h):
        s.panel(x,y,w,h,12,stroke=A,sw=2)
        s.path(f'M{x+20} {y+h-24} L{x+w*.36} {y+h*.42} L{x+w*.56} {y+h*.68} L{x+w*.7} {y+h*.52} L{x+w-20} {y+h-24}Z',c=A,sw=2.2,fill='rgba(94,248,197,.06)')
        s.circle(x+w*.74,y+h*.27,h*.09,c=A,sw=2.2)
    def label(s,t): s.label=t
    def svg(s):
        W,H=s.W,s.H; gx,gy=s.glow
        import re as _re
        body=_re.sub(r'stroke-width="([\d.]+)"',lambda m:f'stroke-width="{float(m.group(1))*1.35:.2f}"',''.join(s.el))
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
 <pattern id="gr" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="rgba(255,255,255,.035)" stroke-width="1"/></pattern>
 <pattern id="gR" width="200" height="200" patternUnits="userSpaceOnUse"><path d="M200 0H0V200" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="1"/></pattern>
 <radialGradient id="rg" cx="{gx/W}" cy="{(gy+s.oy)/H}" r=".55"><stop offset="0" stop-color="{A2}" stop-opacity=".10"/><stop offset=".6" stop-color="{A2}" stop-opacity=".02"/><stop offset="1" stop-color="{A2}" stop-opacity="0"/></radialGradient>
 <radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="{BG}" stop-opacity="0"/><stop offset="1" stop-color="{BG}" stop-opacity=".9"/></radialGradient>
 <filter id="g" filterUnits="userSpaceOnUse" x="-300" y="-300" width="{W+600}" height="{H+600}"><feGaussianBlur stdDeviation="5" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .55 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9" fill="none" stroke="{A}" stroke-width="1.6"/></marker>
</defs>
<rect width="{W}" height="{H}" fill="{BG}"/><rect width="{W}" height="{H}" fill="url(#gr)"/><rect width="{W}" height="{H}" fill="url(#gR)"/><rect width="{W}" height="{H}" fill="url(#rg)"/>
<g transform="translate({W/2} {H/2}) scale({s.zoom}) translate({-W/2} {-H/2})">{body}</g>
<rect width="{W}" height="{H}" fill="url(#vg)"/>
<g stroke="{LINE}" stroke-width="1.5" fill="none"><path d="M40 70V40H70M{W-70} 40H{W-40}V70M40 {H-70}V{H-40}H70M{W-70} {H-40}H{W-40}V{H-70}"/></g>
{f'<text x="72" y="{H-62}" font-family="DejaVu Sans Mono, Liberation Mono, monospace" font-size="22" letter-spacing="3" fill="{DIM}"><tspan fill="{A}">●</tspan>  {s.label}</text>' if s.label else ''}
</svg>'''
