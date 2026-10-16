# usage: python -I jamsplit.py jam_page.html
# Splits style#jam_theme into itch's generated part (ends after the '.view_jam_page .jam_filter_picker .divider{...}' rule)
# and the host's appended custom CSS; prints lengths (chars/bytes, CR/LF counts), !important counts and the vars set on .jam_page_wrap.
import re,sys
r=open(sys.argv[1],encoding='utf-8',newline='').read()
c=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',r,re.S).group(1)
i=c.find('.view_jam_page .jam_filter_picker .divider{'); j=c.find('}',i)+1 if i>=0 else len(c)
gen,host=c[:j],c[j:]
print('total',len(c),'generated',len(gen),'host chars',len(host),'host bytes',len(host.encode()),'CR',host.count('\r'),'LF',host.count('\n'),'host w/o CR',len(host.replace('\r','')))
print('generated !important',gen.count('!important'),'host !important',host.count('!important'),'braces',host.count('{'),host.count('}'))
m=re.search(r'\.jam_page_wrap\{(.*?)\}',gen)
print('vars on .jam_page_wrap:',sorted(set(re.findall(r'(--itchio_\w+)\s*:',m.group(1)))) if m else '-')
