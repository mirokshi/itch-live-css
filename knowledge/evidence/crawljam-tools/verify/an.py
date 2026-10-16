# usage: python -I an.py raw/*.html  -> stylesheets, head order, jam_theme split (generated vs custom), body classes, footer/entries counts
import sys,re,json
sys.stdout.reconfigure(encoding='utf-8')
for f in sys.argv[1:]:
    h=open(f,encoding='utf8',errors='replace').read()
    print('=====',f.split('/')[-1], len(h))
    print('style tags:',re.findall(r'<style[^>]*>',h))
    print('link css:',re.findall(r'<link[^>]*(?:stylesheet|\.css)[^>]*>',h)[:6])
    # head order
    head=h.split('</head>')[0]
    order=[(m.start(),m.group(0)[:90]) for m in re.finditer(r'<(?:link[^>]*rel="stylesheet"[^>]*|style[^>]*|script[^>]*)>',head)]
    print('head order:'); [print('  ',o[1]) for o in order]
    m=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',h,re.S)
    if m:
        t=m.group(1); print('jam_theme len',len(t))
        k=t.rfind('.jam_filter_picker .divider{')
        if k>=0:
            e=t.find('}',k)+1; print('gen len',e,'custom len',len(t)-e, 'custom stripped',len(t[e:].strip()))
            print('boundary:',repr(t[e-60:e+80]))
        print('n !important in gen', t[:e].count('!important') if k>=0 else None)
    print('custom_css count', len(re.findall(r'id="custom_css"',h)), 'wrapper', re.findall(r'<div[^>]*id="wrapper"[^>]*>',h))
    b=re.search(r'<body[^>]*>',h); print('body:',b.group(0) if b else None)
    print('class="footer"',h.count('class="footer"'),'itch_footer',h.count('itch_footer'),'entries',h.count('id="entries"'))
    vj=re.search(r'class="([^"]*view_jam_page[^"]*)"',h); print('view:',vj.group(1) if vj else None)
