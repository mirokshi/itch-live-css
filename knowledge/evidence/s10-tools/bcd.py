# usage: python -I bcd.py <bcd dir> ; prints version_added for chrome/firefox/safari/safari_ios for chosen features (+notes)
import json,sys,os
d=sys.argv[1]
def load(n): return json.load(open(os.path.join(d,n),encoding='utf8'))
def get(o,path):
    for k in path: o=o[k]
    return o['__compat']
def ver(s):
    if isinstance(s,str): return s
    if isinstance(s,list): s=s[0]
    v=s.get('version_added'); extra=[]
    if s.get('prefix'): extra.append('prefix '+s['prefix'])
    if s.get('partial_implementation'): extra.append('partial')
    if s.get('flags'): extra.append('flag')
    n=s.get('notes'); 
    if n: extra.append('note: '+(n if isinstance(n,str) else ' / '.join(n))[:140])
    return str(v)+(' ['+'; '.join(extra)+']' if extra else '')
feats=[('properties_content.json',['css','properties','content','alt_text']),
 ('properties_background-attachment.json',['css','properties','background-attachment','fixed']),
 ('properties_backdrop-filter.json',['css','properties','backdrop-filter']),
 ('properties_forced-color-adjust.json',['css','properties','forced-color-adjust']),
 ('selectors_focus-visible.json',['css','selectors','focus-visible']),
 ('at-rules_media.json',['css','at-rules','media','prefers-reduced-motion']),
 ('at-rules_media.json',['css','at-rules','media','forced-colors']),
 ('at-rules_media.json',['css','at-rules','media','hover']),
 ('at-rules_media.json',['css','at-rules','media','prefers-contrast']),
 ('properties_overflow.json',['css','properties','overflow','clip'])]
for f,p in feats:
    try: c=get(load(f),p)
    except KeyError as e: print(p[-1],'MISSING',e); continue
    s=c['support']; st=c.get('status',{})
    print(p[-1].ljust(22),' | '.join(b+': '+ver(s.get(b,{})) for b in ['chrome','firefox','safari','safari_ios']))
