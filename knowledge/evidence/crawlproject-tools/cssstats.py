# Aggregate statistics over style#custom_css blocks (sizes, scoping, selectors). Prints numbers only, never the CSS.
# usage: python -I cssstats.py "raw/[pc]-*.html"
import re,sys,glob,os,collections,html
tot=collections.Counter(); pages=collections.Counter()
for f in sorted(glob.glob(sys.argv[1])):
    t=open(f,encoding='utf-8').read()
    m=re.search(r'<style[^>]*id="custom_css"[^>]*>(.*?)</style>',t,re.S)
    if not m: continue
    css=m.group(1)
    raw=css
    css_nc=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    b64=sum(len(x) for x in re.findall(r'data:[^)\'"]+',css_nc))
    imports=re.findall(r'@import\s+(?:url\()?["\']?([^"\')\s;]+)',css_nc)
    urls=re.findall(r'url\(\s*["\']?([^"\')]+)',css_nc)
    hosts=collections.Counter(re.sub(r'^(https?:)?//([^/]+).*',r'\2',u) if not u.startswith('data:') else 'data:' for u in urls)
    # selectors
    sels=[]
    for blk in re.finditer(r'([^{}]+)\{',css_nc):
        s=blk.group(1).strip()
        if s.startswith('@') : continue
        if re.match(r'^(from|to|\d+%)',s): continue
        for one in s.split(','):
            one=one.strip()
            if one: sels.append(one)
    scoped=sum(1 for s in sels if s.startswith('#wrapper') or s.startswith('.wrapper'))
    classes=collections.Counter(c for s in sels for c in re.findall(r'\.([A-Za-z_][\w-]*)',s))
    ids=collections.Counter(c for s in sels for c in re.findall(r'#([A-Za-z_][\w-]*)',s))
    at=collections.Counter(re.findall(r'@([a-z-]+)',css_nc))
    imp=css_nc.count('!important')
    ents='&gt;' in raw or '&amp;' in raw or '&quot;' in raw or '&#' in raw
    minified = raw.count('\n')<3 and len(raw)>300
    print(f"{os.path.basename(f)}: len={len(raw)} nocomment={len(css_nc)} data_uri_chars={b64} sels={len(sels)} scoped_wrapper={scoped} important={imp} entity_escaped={ents} minified={minified} lines={raw.count(chr(10))}")
    print('   at:',dict(at),' imports:',[re.sub(r'^(https?:)?//([^/]+).*',r'\2',i) for i in imports],' url-hosts:',dict(hosts))
    print('   ids:',dict(ids.most_common(8)))
    print('   classes:',dict(classes.most_common(25)))
    for c in classes: pages[c]+=1
    for c in ids: pages['#'+c]+=1
print('\nCLASS/ID -> #pages using it')
print(pages.most_common(80))
