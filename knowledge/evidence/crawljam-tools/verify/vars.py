# usage: python -I vars.py raw/ov_*.html  -> theme variables, .jam_page_wrap declarations, heading rule, panel rgba, box-shadow
import re,sys
sys.stdout.reconfigure(encoding='utf-8')
for f in sys.argv[1:]:
    h=open(f,encoding='utf8').read()
    m=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',h,re.S)
    if not m: print(f,'NO THEME');continue
    t=m.group(1)
    k=t.rfind('.jam_filter_picker .divider{'); e=t.find('}',k)+1 if k>=0 else len(t)
    g=t[:e]
    v=dict(re.findall(r'(--itchio_\w+):\s*([^;}]+)',g))
    wrap=re.search(r'\.jam_page_wrap\{([^}]*)\}',g)
    hd=re.search(r'\.view_jam_page h6\{([^}]*)\}',g)
    panel=re.search(r'\.grid_outer\{background-color:\s*([^;}]+)',g)
    sh=re.search(r'\.view_jam_page \.jam_body\{box-shadow:\s*([^;}]+)',g)
    print(f.split('/')[-1][:40], 'gen',len(g),'cust',len(t[e:].strip()))
    print('   vars',v)
    if wrap:
        w=wrap.group(1); print('   wrap non-var:',[d for d in w.split(';') if d.strip() and not d.strip().startswith('--')])
    print('   head:',hd.group(1) if hd else None,'| panel:',panel.group(1) if panel else None,'| shadow:',sh.group(1) if sh else None)
