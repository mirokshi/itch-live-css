import sys, re
from html.parser import HTMLParser
from collections import Counter
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
def extract_bio(s):
    i = s.find('class="user_profile formatted"')
    st = s.rfind('<', 0, i)
    # walk divs to find matching close
    depth = 0; pos = st
    for m in re.finditer(r'<(/?)div\b[^>]*>', s[st:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            end = st + m.end(); break
    inner = s[s.find('>', i)+1 : end - len('</div>')]
    return inner
class P(HTMLParser):
    def __init__(s2):
        super().__init__(convert_charrefs=True); s2.tags=Counter(); s2.cls=Counter(); s2.attrs=Counter(); s2.styles=[]; s2.imgs=[]; s2.links=[]
    def handle_starttag(s2, tag, attrs):
        a = dict(attrs); s2.tags[tag]+=1
        for k,v in attrs: s2.attrs[(tag,k)]+=1
        for c in (a.get('class') or '').split(): s2.cls[c]+=1
        if 'style' in a: s2.styles.append((tag,a['style']))
        if tag=='img': s2.imgs.append(a)
        if tag=='a': s2.links.append(a)
def stats(h, label):
    p=P(); p.feed(h)
    print(f'== {label}: chars={len(h)} tags={dict(p.tags)}')
    print('  classes:', len(p.cls), sorted(p.cls)[:40])
    print('  style attrs:', len(p.styles), [v for t,v in p.styles])
    print('  img: n=', len(p.imgs), 'loading=', sum('loading' in a for a in p.imgs), 'alt=', sum('alt' in a for a in p.imgs))
    tb=[a for a in p.links if a.get('target')=='_blank']
    print('  a: n=', len(p.links), 'target_blank=', len(tb), 'with rel=', Counter(a.get('rel') for a in p.links), 'referrerpolicy=', Counter(a.get('referrerpolicy') for a in p.links))
    return p
served = extract_bio(open(sys.argv[1], encoding='utf-8').read())
src = open(sys.argv[2], encoding='utf-8').read()
a = stats(src, 'source'); b = stats(served, 'served')
print('classes only in source:', set(a.cls)-set(b.cls), ' only in served:', set(b.cls)-set(a.cls))
