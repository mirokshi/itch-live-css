"""Classify <a> tags inside user-content containers by host and rel/referrerpolicy presence.
Usage: python -I links.py <pages_dir>"""
import os, re, sys
from collections import Counter
from html.parser import HTMLParser
from urllib.parse import urlparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyze import kind_of, VOID

class L(HTMLParser):
    def __init__(self, out, styles):
        super().__init__(convert_charrefs=False)
        self.stack=[]; self.kind=None; self.d=None; self.out=out; self.styles=styles
    def handle_starttag(self, tag, attrs):
        ad=dict(attrs)
        if self.kind is None:
            k=kind_of((ad.get('class') or '').split())
            if k and tag not in VOID:
                self.kind=k; self.d=len(self.stack); self.stack.append(tag); return
        if self.kind:
            if tag=='a' and 'href' in ad:
                host=urlparse(ad['href']).netloc
                itch = host.endswith('itch.io') or host.endswith('itch.zone')
                self.out[(self.kind, 'itch-host' if itch else ('mailto' if ad['href'].startswith('mailto') else 'external'), 'rel='+str(ad.get('rel')), 'refpol='+str(ad.get('referrerpolicy')))]+=1
            if 'style' in ad and ad['style'] is not None:
                v=ad['style'].strip()
                self.styles[(self.kind, 'ends_with_semicolon' if v.endswith(';') else ('empty' if v=='' else 'no_trailing_semicolon'))]+=1
        if tag not in VOID: self.stack.append(tag)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1]==tag: self.stack.pop()
    def handle_endtag(self, tag):
        if tag in VOID: return
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i]==tag: del self.stack[i:]; break
        if self.kind and len(self.stack)<=self.d: self.kind=None

out=Counter(); styles=Counter()
P=sys.argv[1]
for fn in sorted(os.listdir(P)):
    h=open(os.path.join(P,fn),encoding='utf-8',errors='replace').read()
    L(out, styles).feed(h)
for k,v in sorted(out.items()): print(v, k)
print('--- style attribute endings (user containers, includes itch-generated button styles)')
for k,v in sorted(styles.items()): print(v, k)
