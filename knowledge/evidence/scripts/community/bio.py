import sys, re
from html.parser import HTMLParser
from collections import Counter
s = open(sys.argv[1], encoding='utf-8').read()
target_cls = sys.argv[2] if len(sys.argv) > 2 else 'user_profile'
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
class P(HTMLParser):
    def __init__(s2):
        super().__init__(convert_charrefs=True); s2.depth=0; s2.inside=False; s2.tags=Counter(); s2.classes=Counter(); s2.attrs=Counter(); s2.styles=[]; s2.start_depth=None
    def handle_starttag(s2, tag, attrs):
        a = dict(attrs)
        if not s2.inside and target_cls in (a.get('class') or '').split():
            s2.inside=True; s2.start_depth=s2.depth
            if tag not in VOID: s2.depth+=1
            return
        if s2.inside:
            s2.tags[tag]+=1
            for k,v in attrs:
                s2.attrs[(tag,k)]+=1
                if k=='class':
                    for c in (v or '').split(): s2.classes[c]+=1
                if k=='style': s2.styles.append((tag, v))
        if tag not in VOID: s2.depth+=1
    def handle_endtag(s2, tag):
        if tag in VOID: return
        s2.depth-=1
        if s2.inside and s2.depth==s2.start_depth: s2.inside=False
p=P(); p.feed(s)
print('TAGS', dict(p.tags)); print('CLASSES', dict(p.classes)); print('ATTRS', sorted(p.attrs.items()))
print('STYLE ATTRS', len(p.styles))
for t,v in p.styles[:15]: print('  ', t, v[:120])
