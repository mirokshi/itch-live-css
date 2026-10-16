import json,re,sys
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
pages=[]
for fn in sys.argv[1:]:
    pages+= [x for x in json.load(open(fn,encoding='utf-8')) if x.get('wrapper') and x['file'] not in ('mobile_mirokshi.html','es_mirokshi.html')]
print(len(pages),'pages')
def norm(t):
    t=re.sub(r'#[0-9a-fA-F]{3,8}','#C',t); t=re.sub(r'rgba\([^)]*\)','RGBA',t)
    t=re.sub(r'url\([^)]*\)','URL',t); t=re.sub(r'font-size: \d+%','font-size: N%',t)
    t=re.sub(r'--itchio_border_radius: \d+px','--itchio_border_radius: Npx',t); t=re.sub(r'border-radius: \d+px','border-radius: Npx',t)
    t=re.sub(r'--itchio_font_family: [^;]*;','--itchio_font_family: F;',t); t=re.sub(r'font-family: [^;]*;','font-family: FF;',t)
    t=re.sub(r'\.user_page_wrap\{[^}]*\}','.user_page_wrap{BG}',t); t=re.sub(r'\.header \.image_header img\{[^}]*\}','.header .image_header img{HI}',t)
    return t
tpl=Counter(norm(p['user_theme']) for p in pages); print('distinct templates',len(tpl))
print('has # id selector', sum(1 for p in pages if re.search(r'#[A-Za-z_]',re.sub(r':\s*#[0-9a-fA-F]+','',p['user_theme']))))
def hx(h): return [int(h[i:i+2],16) for i in (1,3,5)]
ok_floor=ok_round=0
bgs=Counter();ims=Counter();fs=Counter();br=Counter();ff=Counter();rep=Counter()
for p in pages:
    t=p['user_theme']
    ui=re.search(r'--itchio_ui_bg: (#[0-9a-fA-F]+)',t).group(1); bg=re.search(r'body\{background-color: (#[0-9a-fA-F]+)',t).group(1)
    if len(bg)!=7 or len(ui)!=7: print('nonstd hex',bg,ui); continue
    f=[int(0.2*b+0.8*0x33) for b in hx(bg)]; r=[round(0.2*b+0.8*0x33) for b in hx(bg)]
    ok_floor+= f==hx(ui); ok_round+= r==hx(ui)
    w=re.search(r'\.user_page_wrap\{([^}]*)\}',t).group(1)
    bgs[re.sub(r'url\([^)]*\)','URL',w)]+=1
    ims[re.search(r'\.header \.image_header img\{([^}]*)\}',t).group(1)]+=1
    fs[re.search(r'font-size: (\d+%)',t).group(1)]+=1
    br[re.search(r'--itchio_border_radius: (\d+px)',t).group(1)]+=1
    ff[re.search(r'--itchio_font_family: ([^;]*);',t).group(1)]+=1
    urls=re.findall(r'url\(([^)]*)\)',w)
    for u in urls: rep[re.sub(r'img\.itch\.zone/[^/]+/','img.itch.zone/X/',u).split('/')[3] if 'img.itch.zone' in u else u[:30]]+=1
print('ui_bg floor',ok_floor,'round',ok_round)
print('bg blocks');[print('  ',v,repr(k)) for k,v in bgs.most_common()]
print('bg url path kind',rep)
print('header img',ims); print('font-size',sorted(fs.items(),key=lambda x:int(x[0][:-1]))); print('radius',br); print('fonts',ff)
print('vars on .user_page',Counter(tuple(re.findall(r'(--itchio_[a-z_]+):',re.search(r'\.user_page\{(.*)',p['user_theme']).group(1)[:400])) for p in pages))
print('vars on :root',Counter(tuple(re.findall(r'(--itchio_[a-z_]+):',re.search(r':root\{([^}]*)\}',p['user_theme']).group(1))) for p in pages))
print('head orders',Counter(' > '.join(x for x in p['head_order']) for p in pages).most_common(6))
fl=Counter()
for p in pages:
    for x in p['head_order']:
        if 'fonts.googleapis' in x: fl[x]+=1
print(fl)
