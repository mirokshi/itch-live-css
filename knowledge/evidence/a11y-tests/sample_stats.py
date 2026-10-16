# Aggregate a11y-relevant statistics over sampled project pages (raw files stay in scratchpad).
import re,sys,os,glob
d=sys.argv[1]
def hx(h):
    h=h.strip().lstrip('#')
    if len(h)==3: h=''.join(c*2 for c in h)
    return tuple(int(h[i:i+2],16) for i in (0,2,4))
def rgba(s):
    s=s.strip()
    if s.startswith('#'): return hx(s),1.0
    m=re.match(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)',s)
    if m: return tuple(int(m.group(i)) for i in (1,2,3)), float(m.group(4) or 1)
    return None,None
def lum(c):
    f=lambda v:(v/255)/12.92 if v/255<=0.04045 else ((v/255+0.055)/1.055)**2.4
    r,g,b=map(f,c); return .2126*r+.7152*g+.0722*b
def cr(a,b):
    x,y=sorted((lum(a),lum(b)),reverse=True); return (x+.05)/(y+.05)
over=lambda fg,a,bg: tuple(round(f*a+b*(1-a)) for f,b in zip(fg,bg))
files=sorted(glob.glob(os.path.join(d,'p*.html')))
tot=0; stats={}; contr=[]
def inc(k): stats[k]=stats.get(k,0)+1
for f in files:
    s=open(f,encoding='utf8',errors='replace').read()
    if 'id="wrapper"' not in s: continue
    tot+=1
    body=re.search(r'<body[^>]*>',s).group(0)
    if 'embedded_game' in body: inc('embedded_game body (h1 hidden by itch)')
    if re.search(r'class="header[^"]*has_image',s): inc('header.has_image (h1 hidden by itch)')
    m=re.search(r'class="header[^"]*has_image[^"]*"[^>]*>(?:<a[^>]*>)?<img([^>]*)>',s)
    if m and 'alt="' in m.group(1): inc('banner img has alt')
    h1s=len(re.findall(r'<h1\b',s)); inc(f'h1 count in markup={h1s}')
    th=re.search(r'<style id="game_theme"[^>]*>(.*?)</style>',s,re.S)
    if th:
        t=th.group(1); v=lambda n: (re.search(n+r':\s*([^;]+);',t) or [None,None])[1]
        bg2,a2=rgba(v('--itchio_bg2_color') or ''); txt,_=rgba(v('--itchio_text_color') or ''); link,_=rgba(v('--itchio_link_color') or '')
        bg,_=rgba(v('--itchio_bg_color') or ''); btn,_=rgba(v('--itchio_button_color') or ''); bfg,_=rgba(v('--itchio_button_fg_color') or '')
        if bg2 and txt and link and bg:
            eff=over(bg2,a2,bg)
            contr.append((os.path.basename(f),cr(txt,eff),cr(link,eff),cr(bfg,btn) if btn and bfg else None,a2))
    cc=re.search(r'<style id="custom_css"[^>]*>(.*?)</style>',s,re.S)
    if not cc: continue
    c=cc.group(1); inc('HAS custom_css'); low=c.replace(' ','').lower()
    checks={'outline:none|outline:0':r'outline:(none|0)(?![.\d])','any :focus rule':r':focus','prefers-reduced-motion':r'prefers-reduced-motion','infinite animation':r'infinite',
     '@keyframes':r'@keyframes','hides h1/.header':r'(\.header|h1|\.game_title)[^{}]*\{[^}]*display:none','display:none anywhere':r'display:none','color:transparent':r'color:transparent',
     'cursor custom/none':r'cursor:(url|none)','forced-colors':r'forced-colors','user-select:none':r'user-select:none','backdrop-filter':r'backdrop-filter','background-attachment:fixed':r'background-attachment:fixed|background:[^;}]*fixed',
     ':hover rule':r':hover','media query':r'@media','::before/::after content':r'content:"[^"]','!important':r'!important','font-size in px':r'font-size:\d+px','rem/em units':r'\d(rem|em)\b','@import':r'@import'}
    for k,rx in checks.items():
        if re.search(rx,low): inc('css: '+k)
print('pages analysed:',tot)
for k in sorted(stats): print(f'  {stats[k]:3d}  {k}')
print('theme contrast (text/bg2, link/bg2, buttonfg/button, bg2 alpha):')
fails=[0,0,0]
for n,a,b,c,al in contr:
    fails[0]+=a<4.5; fails[1]+=b<4.5; fails[2]+=(c is not None and c<4.5)
print('  pages with theme vars:',len(contr),' text<4.5:',fails[0],' link<4.5:',fails[1],' buttonfg<4.5:',fails[2])
print('  bg2 alpha<1 (contrast depends on page bg/image):',sum(1 for x in contr if x[4]<1))
import statistics
print('  median link contrast %.2f, min %.2f'%(statistics.median([x[2] for x in contr]),min(x[2] for x in contr)))
from collections import Counter
