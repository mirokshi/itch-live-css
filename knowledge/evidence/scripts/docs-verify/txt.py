import sys, re, html
from html.parser import HTMLParser
# usage: txt.py in.html out.txt  -- whole <body> text, block tags -> newlines, headings marked with their id, links shown [text](href)
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out=[]; s.skip=0; s.href=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if t in('script','style','noscript'): s.skip+=1
        if t in('p','div','li','br','tr','h1','h2','h3','h4','h5','section','fieldset','legend','blockquote','pre'): s.out.append('\n')
        if t in('h1','h2','h3','h4'): s.out.append('#'*int(t[1])+' {%s} '%(a.get('id') or ''))
        if t=='li': s.out.append('- ')
        if t=='a': s.href.append(a.get('href'))
    def handle_endtag(s,t):
        if t in('script','style','noscript'): s.skip-=1
        if t=='a' and s.href:
            h=s.href.pop()
            if h: s.out.append(' <%s>'%h)
        if t in('p','div','li','h1','h2','h3','h4'): s.out.append('\n')
    def handle_data(s,d):
        if not s.skip: s.out.append(d)
p=P(); p.feed(open(sys.argv[1],encoding='utf-8',errors='replace').read())
t=''.join(p.out); t=re.sub(r'[ \t]+',' ',t); t=re.sub(r'\n\s*\n+','\n',t)
open(sys.argv[2],'w',encoding='utf-8').write(t)
