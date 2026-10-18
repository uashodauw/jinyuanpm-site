from lib import *
# ======================= COVERS (1600x900) =======================
def c_personal(s):        # personal agent hub -> calendar / mail / payment / home; payment & home actions pass a human-confirmation node
    s.label='12 / PERSONAL AGENT'; ax,ay=560,450
    sv=[(330,255,'calendar'),(330,645,'mail'),(820,255,'card'),(820,645,'home')]
    for x,y,ic in sv: s.line(ax,ay,x,y,c=LINE,sw=1.6)
    s.circle(ax,ay,118,c=LINE,sw=1.5,glow=False,dash='4 10')
    s.node(ax,ay,70,solid=True)
    for x,y,ic in sv: s.node(x,y,50,icon=ic)
    hx,hy=1250,450
    s.circle(hx,hy,96,c=A,sw=1.6,glow=False,dash='5 9',op=.6)
    s.curve(880,255,hx-80,hy-40,bend=.18,sw=2.2,op=.8)
    s.curve(880,645,hx-80,hy+40,bend=-.18,sw=2.2,op=.8)
    s.node(hx,hy,62,icon='user')
    for i in range(3): s.line(1360,560+i*26,1440-(30 if i%2 else 0),560+i*26,c=NEU,sw=2.2,op=.45)
def c_agent(s):           # goal / perception / action / memory around an agent core
    s.label='01 / AGENT'; cx,cy=800,440
    s.circle(cx,cy,230,c=LINE,sw=1.5,glow=False,dash='4 10')
    pts=[(cx,cy-230,'target'),(cx+230,cy,'eye'),(cx,cy+230,'bolt'),(cx-230,cy,'memory')]
    for i,(x,y,ic) in enumerate(pts):
        nx,ny,_=pts[(i+1)%4]; s.curve(x,y,nx,ny,bend=-.28,sw=2.2,op=.7)
    s.node(cx,cy,70,solid=True)
    for x,y,ic in pts: s.node(x,y,46,icon=ic)
def c_gemini(s):
    s.label='11 / MULTIMODAL'; s.glow=(820,450)
    for i,(dx,dy,op) in enumerate([(-120,-70,.35),(-60,-35,.6)]):
        s.panel(560+dx,250+dy,480,300,14,stroke=NEU,op=op)
    s.imgframe(560,250,480,300)
    s.path('M1040 400 H1180',c=A,sw=2.2,glow=False,dash='6 8')
    s.layers(1280,330,220,3,40)
    s.icon('sparkle',1100,250,46); s.icon('sparkle',1170,610,24); s.icon('sparkle',470,640,20)
    for i in range(4): s.line(1190,480+i*30,1370-(40 if i%2 else 0),480+i*30,c=NEU,sw=2.4,op=.5)
def c_acs(s):             # chat + flow steps
    s.label='02 / AI CUSTOMER SERVICE'
    s.chat(250,250,300,110,'l',2,accent=True); s.chat(330,420,260,90,'r',2)
    xs=[760,960,1160,1360]; ics=['chat','target','gear','headset']
    for i,x in enumerate(xs):
        s.node(x,450,48,icon=ics[i]);  
        if i: s.arrow(xs[i-1]+62,450,x-62,450)
    s.curve(560,320,700,440,bend=.2,sw=2,op=.6)
    s.timeline(760,640,600,4,4,tall=(0,1,2,3))
def c_usedcar(s):
    s.label='03 / USED-CAR AI CS'
    s.car(560,520,1.25)
    s.chat(900,230,330,110,'l',2,accent=True); s.chat(1010,400,300,96,'r',2)
    s.node(1330,640,44,icon='db'); s.curve(1180,500,1300,600,bend=-.2,sw=2,op=.7)
def c_vibe(s):
    s.label='04 / VIBE CODING'
    s.window(300,190,620,520); s.code(350,290,12,w=470,hl=(3,7))
    s.cursor(700,500)
    s.brackets(1180,450,140)
def c_13d(s):
    s.label='05 / 13-DAY DEMO'
    s.timeline(240,520,1120,13,13,tall=(0,6,12))
    s.node(240,330,46,icon='sparkle'); s.node(800,330,46,icon='doc'); s.node(1360,330,46,icon='cube')
    for x in (240,800,1360): s.line(x,380,x,490,c=LINE,sw=1.5,dash='4 6')
    s.path('M300 330 H730',c=NEU,sw=1.6,glow=False,dash='5 8'); s.path('M870 330 H1290',c=NEU,sw=1.6,glow=False,dash='5 8')
def c_eval(s):
    s.label='06 / AGENT EVALUATION'
    s.gauge(560,520,230,.74)
    s.panel(930,240,440,420,16); s.bars(990,300,330,[.86,.62,.74,.48,.92,.56],gap=56)
    for i in range(6): s.icon('check' if i in (0,2,4) else 'target',1350,s.y(0)*0+307+i*56-s.oy,0) if False else None
def c_site(s):
    s.label='07 / GIT · DEPLOY'
    s.branch(200,560,520)
    s.tri(880,450,70); s.arrow(740,560,820,500); s.arrow(960,450,1090,450)
    s.globe(1260,450,170)
    s.window(1130,250,0,0,bar=False) if False else None
def c_rag(s):
    s.label='08 / RAG'
    for i in range(3):
        for j in range(4):
            x,y=260+i*120,220+j*120; hl=(i,j) in ((1,1),(2,2),(0,3))
            s.panel(x,y,92,92,10,stroke=A if hl else LINE,sw=2 if hl else 1.5)
            for k in range(3): s.line(x+16,y+26+k*20,x+76-(20 if k==2 else 0),y+26+k*20,c=A if hl else NEU,sw=2,op=.85 if hl else .4)
    for (i,j) in ((1,1),(2,2),(0,3)): s.curve(260+i*120+92,220+j*120+46,860,450,bend=.12,sw=2,op=.75)
    s.node(940,450,80,icon='cube')
    s.arrow(1035,450,1150,450); s.panel(1170,370,230,160,14,stroke=A,sw=2)
    for k in range(3): s.line(1195,410+k*36,1370-(50 if k==2 else 0),410+k*36,c=NEU if k else A,sw=2.6,op=.8 if not k else .5)
def c_wf(s):
    s.label='09 / WORKFLOW · AGENT'
    xs=[220,360,500,640]
    for i,x in enumerate(xs):
        s.panel(x,410,90,80,12,stroke=A if i==0 else LINE)
        if i: s.arrow(xs[i-1]+92,450,x-4,450,c=NEU,op=.7)
    s.line(800,200,800,700,c=LINE,sw=1.5,dash='4 10')
    s.circle(1150,450,170,c=A,sw=2.2,dash='2 10',glow=False,op=.6)
    s.path('M1150 280 A170 170 0 1 1 1000 370',sw=2.6); s.node(1150,450,64,icon='gear')
    for a in (30,150,250):
        r=math.radians(a); x,y=1150+170*math.cos(r),450-170*math.sin(r); s.dot(x,y,7)
    s.node(1420,250,34,icon='target')
def c_prd(s):
    s.label='10 / PRD'
    s.doc(330,170,420,560,lines=8,checks=4,hl=1)
    s.doc(810,250,300,400,lines=5)
    s.panel(1170,300,220,300,14)
    s.add(f'<rect x="1195" y="{s.y(330)}" width="170" height="110" rx="8" fill="none" stroke="{NEU}" stroke-width="1.8" opacity=".6"/>')
    for k in range(3): s.line(1195,470+k*34,1365-(50 if k==1 else 0),470+k*34,c=NEU,sw=2.2,op=.5)
    s.arrow(755,450,800,450,op=.7); s.arrow(1115,450,1160,450,op=.7)
COVERS={'personal-agent-from-tool-to-collaborator':c_personal,'explain-agent-in-3-minutes':c_agent,'ai-customer-service-rollout':c_acs,
 'used-car-ai-cs-mvp':c_usedcar,'pm-value-vibe-coding':c_vibe,'idea-to-demo-13-days':c_13d,'evaluating-agents':c_eval,
 'personal-site-launch-guide':c_site,'why-rag-matters':c_rag,'workflow-vs-agent':c_wf,'how-to-write-prd':c_prd}
# ======================= BODY FIGURES =======================
def flow(s,ics,y=450,x0=300,x1=1300,arrows=True,solid=None):
    xs=[x0+(x1-x0)*i/(len(ics)-1) for i in range(len(ics))]
    for i,(x,ic) in enumerate(zip(xs,ics)):
        s.node(x,y,50,icon=ic,solid=(solid==i))
        if i and arrows: s.arrow(xs[i-1]+66,y,x-66,y)
    return xs
B={}
def b(slug,n):
    def deco(f): B[(slug,n)]=f; return f
    return deco
# --- AI 客服落地
@b('ai-customer-service-rollout',1)
def _(s):  # 先定边界 AI vs 人工
    s.line(800,170,800,730,c=A,sw=2,dash='6 10',op=.6)
    for i in range(3): s.chat(260,230+i*150,300,90,'l',2,accent=i==0)
    s.node(1100,330,56,icon='headset'); s.node(1100,560,56,icon='shield')
    s.arrow(590,280,1030,330,dash='5 8',op=.6)
@b('ai-customer-service-rollout',2)
def _(s):  # 意图识别 只做分类
    s.chat(220,380,320,110,'l',2,accent=True); s.arrow(560,435,700,450)
    s.node(800,450,70,icon='target')
    for i,y in enumerate((250,370,490,610)):
        s.curve(880,450,1080,y+20,bend=.1,sw=2,op=.7)
        s.panel(1100,y,250,46,23,stroke=A if i==1 else LINE,sw=2 if i==1 else 1.5); s.line(1130,y+23,1290-(i*20),y+23,c=A if i==1 else NEU,sw=2.4,op=.8 if i==1 else .45)
@b('ai-customer-service-rollout',3)
def _(s):  # 工具调用 查和办分开
    s.node(300,450,60,icon='chat')
    s.curve(370,430,640,300,bend=-.15); s.curve(370,470,640,600,bend=.15)
    s.panel(660,240,560,120,16,stroke=A,sw=2); s.icon('search',720,300,30)
    for k in range(2): s.line(780,285+k*30,1170-k*90,285+k*30,c=NEU,sw=2.4,op=.5)
    s.panel(660,540,560,120,16); s.icon('gear',720,600,30); s.icon('lock',1160,600,26)
    for k in range(2): s.line(780,585+k*30,1080-k*90,585+k*30,c=NEU,sw=2.4,op=.5)
@b('ai-customer-service-rollout',4)
def _(s):  # 转人工 交接
    flow(s,['chat','target','doc'],x0=260,x1=820)
    s.arrow(890,450,1110,450,dash='6 8'); s.node(1240,450,70,icon='headset')
    s.panel(930,560,260,110,14); [s.line(955,595+k*28,1160-k*60,595+k*28,c=NEU,sw=2.2,op=.5) for k in range(3)]
# --- 评价 Agent
@b('evaluating-agents',1)
def _(s):  # 演示 vs 生产
    s.panel(250,260,460,320,16,stroke=NEU,op=.7); s.path('M480 180 L330 560 H630Z',c=A,sw=1.5,fill='rgba(94,248,197,.05)',glow=False,op=.6); s.icon('sparkle',480,430,40)
    s.arrow(760,430,900,430,dash='6 8')
    for i in range(4):
        s.panel(960,230+i*95,380,74,12,stroke=A if i==0 else LINE)
        s.dot(995,267+i*95,6); s.line(1030,267+i*95,1290-(i%2)*80,267+i*95,c=NEU,sw=2.4,op=.5)
@b('evaluating-agents',2)
def _(s):  # 8 个问题
    for i in range(8):
        x=300+(i%4)*260; y=260+(i//4)*210
        s.panel(x,y,220,170,14,stroke=A if i in (0,5) else LINE,sw=2 if i in (0,5) else 1.5)
        s.icon(['target','search','gear','shield','memory','check','doc','bolt'][i],x+50,y+55,24)
        for k in range(2): s.line(x+30,y+110+k*26,x+190-k*50,y+110+k*26,c=NEU,sw=2.2,op=.45)
@b('evaluating-agents',3)
def _(s):  # 完整任务
    s.node(230,450,46,icon='flag')
    pts=[(230,450),(470,330),(720,520),(980,340),(1240,480),(1400,450)]
    for i in range(1,len(pts)): s.curve(*pts[i-1],*pts[i],bend=.15,sw=2.2,op=.8)
    for i,(x,y) in enumerate(pts[1:-1]): s.node(x,y,32,icon='check' if i<3 else 'target')
    s.node(1400,450,46,icon='cube')
@b('evaluating-agents',4)
def _(s):  # 落地方法 循环
    cx,cy=800,450; s.circle(cx,cy,220,c=A,sw=2.2,dash='3 12',glow=False,op=.6)
    for i,ic in enumerate(['target','bolt','search','doc']):
        a=math.radians(90-i*90); x,y=cx+220*math.cos(a),cy-220*math.sin(a); s.node(x,y,46,icon=ic)
        a2=math.radians(90-i*90-90); s.curve(x,y,cx+220*math.cos(a2),cy-220*math.sin(a2),bend=-.22,sw=2.2,op=.75)
    s.gauge(cx,cy+40,90,.7)
# --- 三分钟讲清 Agent
@b('explain-agent-in-3-minutes',1)
def _(s):  # 会自己安排下一步的助理
    s.node(800,450,72,solid=True)
    for i,ic in enumerate(['target','doc','bolt','eye','memory']):
        a=math.radians(90+i*72); x,y=800+250*math.cos(a),450-250*math.sin(a); s.node(x,y,40,icon=ic); s.line(800+80*math.cos(a),450-80*math.sin(a),x-48*math.cos(a),y+48*math.sin(a),c=A,sw=2,op=.6,dash='4 8')
@b('explain-agent-in-3-minutes',2)
def _(s):  # 分工：模型 vs 代码
    s.line(800,180,800,720,c=LINE,sw=1.5,dash='4 10')
    s.node(500,330,70,icon='sparkle'); [s.line(380,470+k*40,620-k*60,470+k*40,c=NEU,sw=2.4,op=.5) for k in range(3)]
    s.window(940,240,420,420); s.code(980,330,8,w=320,hl=(2,5))
@b('explain-agent-in-3-minutes',3)
def _(s):  # 能看到什么、能做什么
    for i,ic in enumerate(['chat','doc','db']):
        y=270+i*180; s.node(330,y,42,icon=ic); s.curve(380,y,700,450,bend=(1-i)*.1,sw=2,op=.7)
    s.node(800,450,80,icon='eye')
    for i,ic in enumerate(['search','bolt','headset']):
        y=270+i*180; s.curve(890,450,1210,y,bend=(i-1)*.1,sw=2,op=.7); s.node(1270,y,42,icon=ic)
@b('explain-agent-in-3-minutes',4)
def _(s):  # 护栏
    flow(s,['chat','sparkle'],x0=260,x1=560)
    s.panel(700,220,40,460,10,stroke=A,sw=2); s.icon('shield',720,450,40)
    s.arrow(630,450,690,450); s.arrow(750,380,980,300); s.arrow(750,520,980,600,dash='6 8',c=NEU)
    s.node(1060,300,46,icon='check'); s.node(1060,600,46,icon='lock')
# --- PRD
@b('how-to-write-prd',1)
def _(s):
    for i,ic in enumerate(['eye','target','shield']): s.node(330,250+i*200,48,icon=ic); s.curve(390,250+i*200,760,450,bend=(1-i)*.08,sw=2,op=.7)
    s.doc(800,210,380,480,lines=6,hl=0)
@b('how-to-write-prd',2)
def _(s):  # 先场景后功能
    for i in range(3):
        x=230+i*230; s.panel(x,300,190,150,12,stroke=A if i==0 else LINE)
        s.circle(x+50,345,16,c=NEU,sw=1.8,glow=False); s.line(x+30,400,x+160,400,c=NEU,sw=2,op=.5); s.line(x+30,425,x+120,425,c=NEU,sw=2,op=.5)
        if i: s.arrow(x-36,375,x-6,375,c=NEU,op=.6)
    s.arrow(930,375,1020,375)
    s.doc(1050,230,330,430,lines=6,checks=6)
@b('how-to-write-prd',3)
def _(s):  # 功能需求 → 验收
    s.doc(280,190,440,520,lines=7,hl=2)
    s.arrow(760,450,880,450)
    s.panel(920,250,400,400,16,stroke=A,sw=2)
    for k in range(5):
        y=310+k*68; s.icon('check',970,y,18); s.line(1010,y,1270-(k%2)*70,y,c=NEU,sw=2.4,op=.55)
@b('how-to-write-prd',4)
def _(s):  # 数据/非功能/合规
    for i,(ic,t) in enumerate([('db',0),('gauge',1),('shield',2)]):
        x=260+i*390; s.panel(x,230,320,440,16,stroke=A if i==0 else LINE)
        if ic=='gauge': s.gauge(x+160,430,110,.62)
        else: s.icon(ic,x+160,400,70)
        for k in range(2): s.line(x+40,560+k*36,x+280-k*80,560+k*36,c=NEU,sw=2.4,op=.5)
# --- 个人网站上线
@b('personal-site-launch-guide',1)
def _(s):  # 本地 vs 上线
    s.window(240,260,460,320); s.code(280,350,6,w=340,hl=(1,))
    s.path('M720 420 C860 420 900 420 1040 420',c=NEU,sw=2,glow=False,dash='6 10'); s.icon('lock',880,380,26)
    s.globe(1200,430,160)
@b('personal-site-launch-guide',2)
def _(s):  # Vercel：项目→网站
    s.node(330,450,60,icon='db'); s.arrow(400,450,620,450)
    s.tri(720,460,80); s.arrow(820,450,1000,450)
    s.window(1020,250,380,400); s.add(f'<rect x="1050" y="{s.y(320)}" width="320" height="140" rx="8" fill="rgba(94,248,197,.05)" stroke="{A}" stroke-width="1.6" opacity=".7"/>'); [s.line(1050,500+k*34,1340-k*60,500+k*34,c=NEU,sw=2.2,op=.5) for k in range(3)]
@b('personal-site-launch-guide',3)
def _(s):  # 第一次上线经历
    flow(s,['doc','memory','db','bolt','eye'],x0=240,x1=1360)
    s.timeline(240,620,1120,5,5,tall=(0,1,2,3,4))
@b('personal-site-launch-guide',4)
def _(s):  # 更新流程
    s.branch(240,450,660)
    s.arrow(960,450,1090,450); s.tri(1170,460,60); s.path('M1250 400 C1340 300 1340 600 1250 520',sw=2,dash='5 8')
# --- Vibe Coding
@b('pm-value-vibe-coding',1)
def _(s):
    s.window(260,200,700,500); s.code(310,290,12,w=520,hl=(4,))
    s.cursor(840,410); s.node(1200,330,56,icon='target'); s.node(1200,580,56,icon='eye'); s.curve(1140,360,980,420,bend=.2,sw=2,op=.7)
@b('pm-value-vibe-coding',2)
def _(s):  # 概念：说需求→出代码
    s.chat(240,340,380,140,'l',3,accent=True); s.arrow(650,410,780,410)
    s.brackets(920,410,90); s.arrow(1060,410,1160,410)
    s.window(1180,260,240,300); s.code(1205,340,6,w=170,hl=(1,))
@b('pm-value-vibe-coding',3)
def _(s):  # 今天就能做的 4 件事
    s.panel(420,190,760,520,18)
    for k in range(4):
        y=280+k*110; s.add(f'<rect x="480" y="{s.y(y-18)}" width="36" height="36" rx="8" fill="none" stroke="{A}" stroke-width="2.2"/>'); s.icon('check',498,y,14)
        s.line(550,y,1110-(k%2)*120,y,c=NEU,sw=2.6,op=.55)
# --- 二手车 AI 客服 MVP
@b('used-car-ai-cs-mvp',1)
def _(s):  # 开卷考试
    s.path('M300 620 L300 330 Q470 280 640 330 L640 620 Q470 570 300 620Z M640 330 Q810 280 980 330 L980 620 Q810 570 640 620',c=A,sw=2.4,fill=CARD)
    for k in range(5): s.line(340,380+k*40,600,370+k*40,c=NEU,sw=2,op=.4); s.line(680,370+k*40,940,380+k*40,c=A if k==2 else NEU,sw=2.4 if k==2 else 2,op=.85 if k==2 else .4)
    s.arrow(1000,450,1130,450); s.node(1230,450,66,icon='sparkle')
@b('used-car-ai-cs-mvp',2)
def _(s):  # 找错了页
    s.chat(220,360,300,100,'l',2,accent=True)
    for i in range(4):
        x=700+i*170; s.panel(x,290,130,170,10,stroke=A if i==2 else LINE,sw=2 if i==2 else 1.5)
        [s.line(x+20,330+k*30,x+110-(k%2)*30,330+k*30,c=NEU,sw=2,op=.4) for k in range(4)]
    s.curve(540,400,760,280,bend=-.2,c=NEU,dash='6 8'); s.path('M745 245 l30 30 m0 -30 l-30 30',c=NEU,sw=2.6,glow=False)
    s.curve(540,420,1080,480,bend=.18)
@b('used-car-ai-cs-mvp',3)
def _(s):  # 同一个问题怎么走 4 步
    flow(s,['chat','sparkle','db','check'],x0=260,x1=1340)
    s.timeline(260,620,1080,4,4,tall=(0,1,2,3))
@b('used-car-ai-cs-mvp',4)
def _(s):  # 护栏 模型不碰事实
    s.node(400,450,64,icon='sparkle'); s.panel(560,230,40,440,10,stroke=A,sw=2); s.icon('shield',580,450,34)
    s.node(860,450,70,icon='db'); s.arrow(940,450,1100,450); s.panel(1120,350,260,200,14,stroke=A,sw=2); s.icon('car',1250,450,90)
    s.arrow(470,450,550,450,c=NEU,dash='5 7')
# --- RAG
@b('why-rag-matters',1)
def _(s):  # 模型 + 资料
    s.node(560,450,90,icon='sparkle')
    for i in range(3): s.doc(900+i*40,220+i*50,300,380,lines=5,hl=None if i<2 else 1)
    s.arrow(880,450,670,450,dash='6 8')
@b('why-rag-matters',2)
def _(s):  # 开卷 检索→生成
    for i in range(6):
        x=240+(i%2)*140; y=230+(i//2)*150; hl=i in (1,4)
        s.panel(x,y,110,120,10,stroke=A if hl else LINE,sw=2 if hl else 1.5); [s.line(x+18,y+30+k*24,x+92-(k%2)*24,y+30+k*24,c=A if hl else NEU,sw=2,op=.8 if hl else .4) for k in range(4)]
    s.node(700,450,52,icon='search'); s.curve(490,290,640,440,bend=-.1); s.curve(350,590,640,470,bend=.1)
    s.arrow(760,450,900,450); s.node(1000,450,72,icon='cube'); s.arrow(1080,450,1180,450)
    s.panel(1200,360,200,180,14,stroke=A,sw=2); [s.line(1222,400+k*34,1375-(k%2)*50,400+k*34,c=NEU if k else A,sw=2.4,op=.5 if k else .9) for k in range(4)]
@b('why-rag-matters',3)
def _(s):  # 客服/搜索/企业助手
    s.node(800,640,62,icon='db')
    for i,ic in enumerate(['chat','search','memory']):
        x=360+i*440; s.panel(x-150,210,300,190,16,stroke=A if i==1 else LINE); s.icon(ic,x,290,44)
        s.line(x-100,360,x+100,360,c=NEU,sw=2.2,op=.5); s.curve(x,410,800,575,bend=(1-i)*.1,sw=2,op=.7,arrowhead=False)
@b('why-rag-matters',4)
def _(s):  # PM 推进顺序
    flow(s,['target','doc','search','gauge' if False else 'eye','bolt'],x0=240,x1=1360)
    s.timeline(240,620,1120,5,5,tall=(0,1,2,3,4))
# --- Workflow vs Agent
@b('workflow-vs-agent',1)
def _(s): c_wf(s); s.label=''
@b('workflow-vs-agent',2)
def _(s):  # 固定流程
    xs=[220,460,700,940,1180]
    for i,x in enumerate(xs):
        s.panel(x,390,180,120,14,stroke=A if i in (0,4) else LINE,sw=2 if i in (0,4) else 1.5)
        s.icon(['doc','check','gear','db','flag'][i],x+90,450,30)
        if i: s.arrow(xs[i-1]+186,450,x-6,450)
@b('workflow-vs-agent',3)
def _(s):  # 路径不确定
    s.node(330,450,52,icon='flag'); s.node(1280,450,52,icon='target')
    s.node(800,450,74,icon='gear')
    for y,b_ in ((260,-.2),(450,0),(640,.2)):
        s.curve(390,450,720,y,bend=b_*-.5,sw=2,op=.55,dash='5 8')
        s.curve(880,450,1220,y if y!=450 else 450,bend=b_*.5,sw=2.2 if y==260 else 1.8,op=.9 if y==260 else .45)
    s.path('M800 360 A90 90 0 1 1 720 410',sw=2.2,dash='4 8')
@b('workflow-vs-agent',4)
def _(s):  # 结合
    xs=[220,460,940,1180]
    for i,x in enumerate(xs): s.panel(x,400,170,100,14); s.icon(['doc','check','db','flag'][i],x+85,450,28)
    s.arrow(392,450,454,450,c=NEU); s.arrow(632,450,694,450); s.node(800,450,90,icon='gear'); s.circle(800,450,130,c=A,sw=1.6,dash='3 10',glow=False,op=.6); s.arrow(905,450,934,450); s.arrow(1112,450,1174,450,c=NEU)
