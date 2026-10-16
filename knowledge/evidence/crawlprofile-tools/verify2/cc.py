import json,re,sys
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
for fn in sys.argv[1:]:
    raw=open(fn,'rb').read()
    m=re.search(rb'<style[^>]*id="custom_css"[^>]*>(.*?)</style>',raw,re.S)
    if not m: continue
    b=m.group(1); t=b.decode('utf-8')
    nc=re.sub(r'/\*.*?\*/','',t,flags=re.S)
    # top-level selectors (crude: strip at-rule wrappers by taking text before '{' that isn't an at-rule)
    sels=[]
    for pre in re.findall(r'([^{};]+)\{',nc):
        pre=pre.strip()
        if not pre or pre.startswith('@') or re.match(r'^(from|to|\d+%)',pre): continue
        for s in pre.split(','): sels.append(s.strip())
    uns=[s for s in sels if not s.startswith('#wrapper') and s]
    imp=[(mm.start(),mm.group(1)[:70]) for mm in re.finditer(r'@import\s+(?:url\()?\s*[\'"]?([^\'")\s;]+)',t)]
    bm=re.search(rb'class="user_profile formatted"',raw)
    print(fn.split('/')[-1], 'chars',len(t),'bytes',len(b),'CR',b.count(b'\r'),'LF',b.count(b'\n'),'comments',len(re.findall(r'/\*',t)),
      'sels',len(sels),'unscoped',len(uns),'imports',imp, 'important',('!important' in t))
    print('    unscoped sample:',sorted(set(uns))[:14])
