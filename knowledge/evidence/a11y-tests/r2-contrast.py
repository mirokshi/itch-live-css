# Independent WCAG contrast check used in the second verification pass (no rounding of composites).
# Independent WCAG 2.x contrast (sRGB linearization threshold 0.04045) with alpha compositing (no rounding).
import sys
def rgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16)/255 for i in (0,2,4)]
def comp(fg,a,bg): return [f*a+b*(1-a) for f,b in zip(fg,bg)]
def L(c):
    f=lambda v: v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
    return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])
def ratio(a,b):
    x,y=sorted([L(a),L(b)],reverse=True); return (x+.05)/(y+.05)
card=lambda bg: comp(rgb('0a122e'),.5,rgb(bg))
P=[('eef3ff on 0b1433',rgb('eef3ff'),rgb('0b1433')),('eef3ff on 3d6fba',rgb('eef3ff'),rgb('3d6fba')),('eef3ff on card/3d6fba',rgb('eef3ff'),card('3d6fba')),
('ffc857 on 3d6fba',rgb('ffc857'),rgb('3d6fba')),('ffc857 on card/3d6fba',rgb('ffc857'),card('3d6fba')),
('genre .5 on card/3d6fba',comp(rgb('eef3ff'),.5,card('3d6fba')),card('3d6fba')),('genre .5 on card/1b3367',comp(rgb('eef3ff'),.5,card('1b3367')),card('1b3367')),
('361275 on 0b1433',rgb('361275'),rgb('0b1433')),('361275 on 1b3367',rgb('361275'),rgb('1b3367')),('361275 on 050311',rgb('361275'),rgb('050311')),('361275 on 3d6fba',rgb('361275'),rgb('3d6fba')),('361275 on 213168',rgb('361275'),rgb('213168')),
('fa5c5c on e8e8e8',rgb('fa5c5c'),rgb('e8e8e8')),('fa5c5c on 585858',rgb('fa5c5c'),rgb('585858')),('fa5c5c on eeeeee',rgb('fa5c5c'),rgb('eeeeee')),('fa5c5c on ffffff',rgb('fa5c5c'),rgb('ffffff')),('fff on fa5c5c',rgb('ffffff'),rgb('fa5c5c')),
('8c8c8c on fff',rgb('8c8c8c'),rgb('ffffff')),('666666 on fff',rgb('666666'),rgb('ffffff')),('0b1433 on ffc857',rgb('0b1433'),rgb('ffc857')),('fff on ff2449',rgb('ffffff'),rgb('ff2449'))]
for n,a,b in P: print(f'{n:28s} {ratio(a,b):6.3f}')
