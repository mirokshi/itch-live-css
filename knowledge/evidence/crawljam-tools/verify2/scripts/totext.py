# usage: python -I totext.py <html> -> readable text of the page (scripts/styles removed)
import sys, re, html
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s): super().__init__(); s.out=[]; s.skip=0
    def handle_starttag(s,t,a):
        if t in('script','style'): s.skip+=1
        if t in('p','br','div','li','h1','h2','h3','h4','tr','pre','section'): s.out.append('\n')
        if t=='code': s.out.append('`')
        if t=='a':
            d=dict(a)
            if d.get('class') and 'post_date' in (d.get('class') or ''): s.out.append('[post '+(d.get('href') or '')+'] ')
    def handle_endtag(s,t):
        if t in('script','style'): s.skip-=1
        if t=='code': s.out.append('`')
    def handle_data(s,d):
        if not s.skip: s.out.append(d)
p=P(); p.feed(open(sys.argv[1],encoding='utf8').read())
txt=re.sub(r'\n\s*\n+','\n',''.join(p.out))
sys.stdout.reconfigure(encoding='utf-8'); print(txt)
