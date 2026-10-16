import re,sys
sys.stdout.reconfigure(encoding='utf-8')
from html.parser import HTMLParser
KEEP=('div','section','nav','header','footer','main','ul','h1','h2','h3','iframe','button','form','aside','dialog')
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.depth=0; s.out=[]; s.stack=[]
    def handle_starttag(s,tag,attrs):
        if tag in ('br','img','meta','link','input','hr','source','path','use','circle','rect','polygon','g','svg','span','a','p','em','strong','li','i','b','abbr','time','label','option','select','textarea','td','tr','table','tbody','thead','th','script','style','noscript','template','picture','video','code','pre','sup','sub','small','u','s','blockquote','ol','dl','dt','dd','figure','figcaption','canvas','audio','object','embed','param','wbr','area','map','col','colgroup','caption','tfoot','fieldset','legend','iframe','button','h4','h5','h6'):
            if tag in KEEP:
                a=dict(attrs); s.out.append('  '*len(s.stack)+tag+('#'+a['id'] if a.get('id') else '')+('.'+'.'.join((a.get('class') or '').split()) if a.get('class') else ''))
            return
        a=dict(attrs)
        if len(s.stack) <= int(sys.argv[2]):
            s.out.append('  '*len(s.stack)+tag+('#'+a['id'] if a.get('id') else '')+('.'+'.'.join((a.get('class') or '').split()) if a.get('class') else ''))
        s.stack.append(tag)
    def handle_endtag(s,tag):
        if tag in s.stack:
            while s.stack and s.stack.pop()!=tag: pass
p=P(); p.feed(open(sys.argv[1],encoding='utf8').read()); print('\n'.join(p.out))
