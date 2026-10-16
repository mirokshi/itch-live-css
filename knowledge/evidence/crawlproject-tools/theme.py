# Selector/variable inventory of style#game_theme across pages. usage: python -I theme.py "raw/[pc]-*.html"
import re,sys,glob,os,collections
sel_pages=collections.Counter(); var_pages=collections.Counter(); n=0
decl_examples=collections.defaultdict(collections.Counter)
for f in sorted(glob.glob(sys.argv[1])):
    t=open(f,encoding='utf-8').read()
    m=re.search(r'<style id="game_theme"[^>]*>(.*?)</style>',t,re.S)
    if not m: print('NO THEME',f); continue
    n+=1; css=m.group(1)
    seen=set()
    for blk in re.finditer(r'([^{}]+)\{([^{}]*)\}',css):
        s=blk.group(1).strip(); body=blk.group(2)
        seen.add(s)
        props=[p.split(':')[0].strip() for p in re.sub(r'/\*.*?\*/','',body,flags=re.S).split(';') if ':' in p]
        for p in props: decl_examples[s][p]+=1
    for s in seen: sel_pages[s]+=1
    for v in set(re.findall(r'(--itchio_[a-z0-9_]+)\s*:',css)): var_pages[v]+=1
print('pages with theme:',n)
print('\nVARS:'); [print(f'  {v}: {c}') for v,c in sorted(var_pages.items(),key=lambda x:-x[1])]
print('\nSELECTORS (pages): props')
for s,c in sorted(sel_pages.items(),key=lambda x:-x[1]):
    print(f'  [{c}] {s[:150]} :: {dict(decl_examples[s])}')
