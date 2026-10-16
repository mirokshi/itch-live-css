# WCAG 2.x contrast ratio calculator with alpha compositing. Usage: python -I contrast.py
def hx(h):
    h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def over(fg,a,bg): return tuple(round(f*a+b*(1-a)) for f,b in zip(fg,bg))
def lum(c):
    def ch(v):
        v/=255; return v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
    r,g,b=map(ch,c); return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True); return (la+0.05)/(lb+0.05)
def hexs(c): return '#%02x%02x%02x'%c
bgs={'BG #0b1433':hx('0b1433'),'img dark #050311':hx('050311'),'img mean #1b3367':hx('1b3367'),'img bright #3d6fba':hx('3d6fba')}
card=lambda bg: over(hx('0a122e'),.5,bg)
rows=[]
for name,c in [('ink #eef3ff',hx('eef3ff')),('muted #a9b9e0',hx('a9b9e0')),('gold #ffc857',hx('ffc857')),('focus #361275',hx('361275'))]:
    for bn,b in bgs.items():
        rows.append((name,bn,cr(c,b)))
        rows.append((name,bn+' +card .5',cr(c,card(b))))
for a,label in [(.75,'theme .game_text a=.75'),(.5,'theme .game_genre a=.5')]:
    for bn,b in bgs.items():
        cb=card(b); fg=over(hx('eef3ff'),a,cb); rows.append((label,bn+' +card .5',cr(fg,cb)))
pairs=[('selection #0b1433','on #ffc857',hx('0b1433'),hx('ffc857')),
 ('jam #8c8c8c','on #ffffff',hx('8c8c8c'),hx('ffffff')),('jam #666666','on #ffffff',hx('666666'),hx('ffffff')),('jam link #db0a15','on #ffffff',hx('db0a15'),hx('ffffff')),
 ('project link #fa5c5c','on #e8e8e8',hx('fa5c5c'),hx('e8e8e8')),('project link #fa5c5c','on #585858',hx('fa5c5c'),hx('585858')),
 ('button fg #ffffff','on #fa5c5c',hx('ffffff'),hx('fa5c5c')),('focus #361275','on #ffffff',hx('361275'),hx('ffffff')),('focus white','on #0b1433',hx('ffffff'),hx('0b1433')),
 ('skip link white','on #FF2449',hx('ffffff'),hx('ff2449'))]
for a,b,c1,c2 in pairs: rows.append((a,b,cr(c1,c2)))
for a,b,r in rows:
    tag='AA-normal' if r>=4.5 else ('AA-large/UI(3:1)' if r>=3 else 'FAIL')
    print(f'{a:28s} {b:28s} {r:5.2f}:1  {tag}')
print('card composites:',{k:hexs(card(v)) for k,v in bgs.items()})
