# usage: python -I gen.py raw/ov_*.html  -> normalized stats of the generated theme (+ number of distinct selector sequences)
import re,glob,sys,collections
sys.stdout.reconfigure(encoding='utf-8')
C=collections.Counter
stats=collections.defaultdict(C); gl=[]
shapes=C()
for f in sys.argv[1:]:
    h=open(f,encoding='utf8').read()
    m=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',h,re.S)
    if not m or 'view_jam' not in h: continue
    t=m.group(1); k=t.rfind('.jam_filter_picker .divider{'); g=t[:t.find('}',k)+1]; gl.append(len(g))
    w=re.search(r'\.jam_page_wrap\{([^}]*)\}',g).group(1)
    for d in w.split(';'):
        d=d.strip()
        if not d or d.startswith('--itchio_link') or d.startswith('--itchio_button') or d.startswith('--itchio_border_color'): continue
        p,_,v=d.partition(':'); v=v.strip()
        if p in('color','background-color'): continue
        if p=='background-image': v='url(...)'
        stats[p][v]+=1
    stats['panel_alpha'][re.search(r'\.grid_outer\{background-color:\s*rgba\([^)]*,\s*([\d.]+)\)',g).group(1)]+=1
    sh=re.search(r'\.view_jam_page \.jam_body\{box-shadow:\s*([^;}]+)',g).group(1)
    sh=re.sub(r'#[0-9a-fA-F]{3,8}','#HEX',sh); sh=re.sub(r'rgba\([^)]*\)','rgba(..)',sh); stats['shadow'][sh]+=1
    hd=re.search(r'\.view_jam_page h6\{([^}]*)\}',g).group(1); stats['heading'][re.sub(r"'[^']*'","'F'",re.sub(r'#\w+','#HEX',hd))]+=1
    stats['border==shadow'][re.search(r'--itchio_button_border_color:\s*([^;]+)',g).group(1)==re.search(r'--itchio_button_shadow_color:\s*([^;]+)',g).group(1)]+=1
    stats['link==button'][re.search(r'--itchio_link_color:\s*([^;]+)',g).group(1).lower()==re.search(r'--itchio_button_color:\s*([^;]+)',g).group(1).lower()]+=1
    # structure: list of selectors
    sels=tuple(re.findall(r'([^{}]+)\{',g)); shapes[sels]+=1
    stats['n_important'][g.count('!important')]+=1
for k,v in stats.items(): print(k, dict(v))
print('gen len range',min(gl),max(gl),'n',len(gl))
print('distinct selector sequences:',len(shapes))
for s,c in shapes.items(): print(c, len(s), s[:3], '...', s[-1])
