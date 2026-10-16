"""Escaping fingerprint of user content: raw quotes vs web_sanitize-style entities in TEXT nodes.
Usage: python -I fingerprint.py <dir> [<dir>...]"""
import os, sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyze import kind_of, VOID

class F(HTMLParser):
    def __init__(self, c):
        super().__init__(convert_charrefs=False); self.c=c; self.stack=[]; self.kind=None; self.d=None
    def handle_starttag(self, tag, attrs):
        ad=dict(attrs)
        if self.kind is None:
            k=kind_of((ad.get('class') or '').split())
            if k and tag not in VOID:
                self.kind=k; self.d=len(self.stack); self.stack.append(tag); return
        if tag not in VOID: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in VOID: return
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i]==tag: del self.stack[i:]; break
        if self.kind and len(self.stack)<=self.d: self.kind=None
    def handle_data(self, data):
        if self.kind:
            self.c[self.kind]['raw_apostrophe']+=data.count("'"); self.c[self.kind]['raw_dquote']+=data.count('"')
            self.c[self.kind]['raw_gt']+=data.count('>')
    def handle_charref(self, name):
        if self.kind: self.c[self.kind]['&#'+name+';']+=1
    def handle_entityref(self, name):
        if self.kind and name in ('quot','apos','gt','lt','amp','nbsp','rsquo','lsquo','ldquo','rdquo','mdash','hellip'):
            self.c[self.kind]['&'+name+';']+=1
c=defaultdict(Counter)
for d in sys.argv[1:]:
    for fn in sorted(os.listdir(d)):
        if fn.endswith('.html'):
            F(c).feed(open(os.path.join(d,fn),encoding='utf-8',errors='replace').read())
for k,v in c.items(): print(k, dict(v.most_common()))
