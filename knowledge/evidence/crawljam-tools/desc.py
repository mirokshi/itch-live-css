# usage: python -I desc.py files... -> tag/attr/class stats inside div.jam_content.user_formatted
import sys,re,collections
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding='utf-8')
tags=collections.Counter(); attrs=collections.Counter(); classes=collections.Counter(); iframe_hosts=collections.Counter(); styles=collections.Counter(); ids=collections.Counter()
class P(HTMLParser):
    def __init__(s): super().__init__(); s.depth=0; s.inside=False; s.d0=None
    def handle_starttag(s,t,a):
        a=dict(a)
        if not s.inside and t=='div' and 'jam_content' in (a.get('class') or ''):
            s.inside=True; s.level=0; return
        if s.inside:
            if t not in ('br','img','hr','input','source','wbr'): s.level+=1
            tags[t]+=1
            for k,v in a.items():
                attrs[f'{t}[{k}]']+=1
                if k=='class':
                    for c in (v or '').split(): classes[c]+=1
                if k=='style': styles[(v or '')[:40]]+=1
                if k=='id': ids[v]+=1
                if t=='iframe' and k=='src': iframe_hosts[re.sub(r'^(https?:)?//([^/]+).*',r'\2',v or '')]+=1
    def handle_endtag(s,t):
        if s.inside:
            if s.level==0 and t=='div': s.inside=False
            elif t not in ('br','img','hr'): s.level-=1
for f in sys.argv[1:]:
    p=P(); p.feed(open(f,encoding='utf8').read())
print('TAGS',tags.most_common()); print('ATTRS',attrs.most_common(60)); print('NON-custom CLASSES',[(c,n) for c,n in classes.items() if not c.startswith('custom-')]);
print('custom- classes count',sum(n for c,n in classes.items() if c.startswith('custom-'))); print('IFRAME hosts',iframe_hosts); print('STYLE attrs',styles.most_common(10)); print('IDS',ids)
