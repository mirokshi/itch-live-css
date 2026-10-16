"""Scan <style id="custom_css"> blocks in saved pages and report features (no CSS text is copied out).
Usage: python -I customcss.py <dir> [<dir> ...]"""
import os, re, sys
rows=[]
for d in sys.argv[1:]:
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.html'): continue
        h=open(os.path.join(d,fn),encoding='utf-8',errors='replace').read()
        for m in re.finditer(r'<style id="custom_css"[^>]*>(.*?)</style>', h, re.S):
            css=m.group(1)
            imports=re.findall(r'@import\s+(?:url\()?\s*[\'"]?([^\'")\s;]+)', css)
            hosts=sorted({re.sub(r'^https?://','',u).split('/')[0] for u in imports})
            rows.append(dict(
                page=fn[:45], len=len(css),
                gt=css.count('>'), amp_gt=css.count('&gt;'), amp_lt=css.count('&lt;'), amp=css.count('&amp;'),
                imports=len(imports), import_hosts=','.join(hosts),
                data_uri=len(re.findall(r'url\(\s*[\'"]?data:', css)),
                fontface=css.count('@font-face'), has_wrapper=css.count('#wrapper'),
                nonascii=sum(1 for c in css if ord(c)>127), comments=css.count('/*'),
                important=css.count('!important'), lt=css.count('<'),
                js=len(re.findall(r'javascript:|expression\(|behavior\s*:|-moz-binding', css, re.I)),
            ))
keys=['page','len','gt','amp_gt','amp_lt','amp','lt','imports','import_hosts','data_uri','fontface','has_wrapper','nonascii','comments','important','js']
print('|'.join(keys))
for r in rows: print('|'.join(str(r[k]) for k in keys))
print('blocks:',len(rows),' max len:',max((r['len'] for r in rows),default=0))
