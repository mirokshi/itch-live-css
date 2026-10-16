import sys, re
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding='utf-8')
# usage: tree.py file.html maxdepth  -- prints element skeleton (tag#id.classes) of <body> up to depth
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','param'}
class P(HTMLParser):
    def __init__(s, maxd):
        super().__init__(); s.d = 0; s.maxd = maxd; s.inbody = False
    def handle_starttag(s, tag, attrs):
        if tag == 'body': s.inbody = True; s.d = 0; return
        if not s.inbody: return
        a = dict(attrs)
        if s.d < s.maxd and tag not in ('script','svg','path','span','a','p','br','img','strong','em','li','option','i','b','abbr','input','button','label','select','textarea','form','source','picture','video','iframe','noscript','template'):
            ident = tag + ('#' + a['id'] if a.get('id') else '') + ('.' + '.'.join(a['class'].split()) if a.get('class') else '')
            print('  ' * s.d + ident[:120])
        if tag not in VOID: s.d += 1
    def handle_endtag(s, tag):
        if s.inbody and tag not in VOID: s.d = max(0, s.d - 1)
p = P(int(sys.argv[2])); p.feed(open(sys.argv[1], encoding='utf-8', errors='replace').read())
