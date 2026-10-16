import re,glob,os,sys
for f in sorted(sys.argv[1:]):
    m=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',open(f,encoding='utf8').read(),re.S)
    if not m: print('no theme:',f); continue
    t=m.group(1)
    w=re.search(r'\.jam_page_wrap\{([^}]*)\}',t).group(1)
    bc=re.search(r'--itchio_border_color:\s*([^;]+)',w).group(1).strip(); lk=re.search(r'--itchio_link_color:\s*([^;]+)',w).group(1).strip()
    bs=re.search(r'\.view_jam_page \.jam_body\{(box-shadow[^}]*)\}',t).group(1)
    fa=re.search(r'filter_item\.active\{([^}]*)\}',t).group(1)
    fb=re.search(r'border-color:\s*([^ ;!]+)',fa).group(1)
    flag='' if fb.lower()==lk.lower() else ' FILTER_BORDER!=LINK'
    if bs.strip()=='box-shadow: 0 0 0 2px transparent;' and not flag: continue
    print(os.path.basename(f)[:45], '|', bs, '| border', bc, '| link', lk, '| filter border',fb, flag)
