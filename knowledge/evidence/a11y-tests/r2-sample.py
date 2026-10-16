# Second-pass recount over the saved 44-page sample (files p01..p47.html; 429 placeholders are skipped).
# usage: python -I r2-sample.py <sample dir>
# Independent recount over saved project pages: title-h1 hiding, banner alt, other h1s, theme link/button contrast.
import re,sys,os,glob
sys.stdout.reconfigure(encoding='utf-8')
d=sys.argv[1]
def parse_color(v):
    v=v.strip()
    m=re.fullmatch(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})',v)
    if m:
        h=m.group(1); h=''.join(c*2 for c in h) if len(h)==3 else h
        return [int(h[i:i+2],16)/255 for i in (0,2,4)],1.0
    m=re.fullmatch(r'rgba?\(([^)]*)\)',v)
    if m:
        p=[x.strip() for x in m.group(1).replace('/',',').split(',')]
        return [float(x)/255 for x in p[:3]], float(p[3]) if len(p)>3 else 1.0
    return None,None
def L(c):
    f=lambda v: v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
    return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])
def ratio(a,b):
    x,y=sorted([L(a),L(b)],reverse=True); return (x+.05)/(y+.05)
n=0; res={'hidden':0,'banner':0,'embed':0,'both':0,'banner_alt_nonempty':0,'no_other_h1':0,'embed_no_banner':0,'custom_css':0,'link_lt45':0,'btn_lt45':0,'link_default':0,'bg2_alpha_lt1':0,'themed':0}
for f in sorted(glob.glob(os.path.join(d,'p*.html'))):
    s=open(f,encoding='utf8',errors='replace').read()
    if 'id="wrapper"' not in s: continue
    n+=1
    body=re.search(r'<body[^>]*>',s).group(0)
    emb='embedded_game' in body and 'embed_disabled' not in body
    hdr=re.search(r'<div[^>]*class="header[^"]*"[^>]*id="header"[^>]*>|<div[^>]*id="header"[^>]*class="header[^"]*"[^>]*>',s)
    ban=bool(hdr and 'has_image' in hdr.group(0))
    if ban: res['banner']+=1
    if emb: res['embed']+=1
    if ban and emb: res['both']+=1
    if ban or emb: res['hidden']+=1
    if emb and not ban: res['embed_no_banner']+=1
    if ban:
        seg=s[hdr.end():hdr.end()+800]; im=re.search(r'<img[^>]*>',seg)
        if im and re.search(r'alt="[^"]+"',im.group(0)): res['banner_alt_nonempty']+=1
    if ban or emb:
        h1s=re.findall(r'<h1\b[^>]*>',s); others=[h for h in h1s if 'game_title' not in h]
        if not others: res['no_other_h1']+=1
    if 'id="custom_css"' in s: res['custom_css']+=1
    th=re.search(r'<style[^>]*id="game_theme"[^>]*>(.*?)</style>',s,re.S)
    if th:
        t=th.group(1); g=lambda k:(re.search(re.escape(k)+r'\s*:\s*([^;}]+)',t) or [None,None])[1]
        bg,_=parse_color(g('--itchio_bg_color') or ''); bg2,a2=parse_color(g('--itchio_bg2_color') or '')
        link,_=parse_color(g('--itchio_link_color') or ''); btn,_=parse_color(g('--itchio_button_color') or ''); bfg,_=parse_color(g('--itchio_button_fg_color') or '')
        if bg and bg2 and link:
            res['themed']+=1
            panel=[c*a2+b*(1-a2) for c,b in zip(bg2,bg)]
            if ratio(link,panel)<4.5: res['link_lt45']+=1
            if a2<1: res['bg2_alpha_lt1']+=1
            if (g('--itchio_link_color') or '').strip().lower()=='#fa5c5c': res['link_default']+=1
            if btn and bfg and ratio(bfg,btn)<4.5: res['btn_lt45']+=1
print('pages',n,res)
