# Independent WCAG 2.x contrast (relative luminance, sRGB threshold 0.04045) with alpha compositing.
import sys
def rgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16) for i in (0,2,4)]
def comp(fg,a,bg): return [round(a*f+(1-a)*b) for f,b in zip(fg,bg)]
def L(c):
    out=[]
    for v in c:
        v=v/255; out.append(v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4)
    return 0.2126*out[0]+0.7152*out[1]+0.0722*out[2]
def ratio(a,b):
    x,y=L(a),L(b); hi,lo=max(x,y),min(x,y); return (hi+0.05)/(lo+0.05)
card=lambda bg: comp(rgb('0a122e'),.5,bg)
T=[('eef3ff on 0b1433',rgb('eef3ff'),rgb('0b1433')),('eef3ff on 3d6fba',rgb('eef3ff'),rgb('3d6fba')),('eef3ff on card/3d6fba',rgb('eef3ff'),card(rgb('3d6fba'))),
('ffc857 on 3d6fba',rgb('ffc857'),rgb('3d6fba')),('ffc857 on card/3d6fba',rgb('ffc857'),card(rgb('3d6fba'))),('a9b9e0 on 3d6fba',rgb('a9b9e0'),rgb('3d6fba')),('a9b9e0 on card/3d6fba',rgb('a9b9e0'),card(rgb('3d6fba'))),
('genre .5 on card/3d6fba',comp(rgb('eef3ff'),.5,card(rgb('3d6fba'))),card(rgb('3d6fba'))),('genre .5 on card/1b3367',comp(rgb('eef3ff'),.5,card(rgb('1b3367'))),card(rgb('1b3367'))),
('genre .5 on 0b1433 (no card)',comp(rgb('eef3ff'),.5,rgb('0b1433')),rgb('0b1433')),
('361275 on 0b1433',rgb('361275'),rgb('0b1433')),('361275 on 1b3367',rgb('361275'),rgb('1b3367')),('361275 on 3d6fba',rgb('361275'),rgb('3d6fba')),('361275 on ffffff',rgb('361275'),rgb('ffffff')),
('fa5c5c on e8e8e8',rgb('fa5c5c'),rgb('e8e8e8')),('fa5c5c on eeeeee',rgb('fa5c5c'),rgb('eeeeee')),('fa5c5c on 585858',rgb('fa5c5c'),rgb('585858')),('fff on fa5c5c',rgb('ffffff'),rgb('fa5c5c')),
('8c8c8c on fff',rgb('8c8c8c'),rgb('ffffff')),('666666 on fff',rgb('666666'),rgb('ffffff')),('0b1433 on ffc857',rgb('0b1433'),rgb('ffc857')),('fff on ff2449',rgb('ffffff'),rgb('ff2449')),
('ffc857 on 0b1433',rgb('ffc857'),rgb('0b1433'))]
for n,a,b in T: print(f'{n:32s} {ratio(a,b):6.2f}')
