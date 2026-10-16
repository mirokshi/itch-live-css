import sys,re
sys.stdout.reconfigure(encoding='utf-8')
for f in sys.argv[1:]:
    s=open(f,encoding='utf8').read()
    toks=[]
    for m in re.finditer(r'<link\b[^>]*rel="?stylesheet"?[^>]*>|<style\b[^>]*>(.*?)</style>',s,re.S|re.I):
        t=m.group(0)
        if t.lower().startswith('<link'):
            h=re.search(r'href="([^"]+)"',t); toks.append('LINK '+(h.group(1) if h else t)[:110])
        else:
            i=re.search(r'id="([^"]+)"',t[:80]); body=m.group(1)
            toks.append(f'STYLE#{i.group(1) if i else "?"} len={len(body)} @import@{body.find("@import")}')
    bodycls=re.search(r'<body[^>]*class="([^"]*)"',s)
    wr=re.search(r'<div[^>]*id="wrapper"[^>]*>',s)
    print('==',f,'| body:',bodycls.group(1) if bodycls else None,'| wrapper:',wr.group(0)[:150] if wr else None)
    for t in toks: print('   ',t)
