# usage: python -I doc.py page.html -> text of main docs content with headings (h ids) and link targets
import sys,re,html
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
raw=open(sys.argv[1],encoding='utf-8',errors='replace').read()
m=re.search(r'<div[^>]*class="[^"]*(?:content_column|doc_page|page_content)[^"]*"[^>]*>(.*)<div[^>]*class="footer',raw,re.S)
c=m.group(1) if m else raw
c=re.sub(r'<(script|style)[^>]*>.*?</\1>','',c,flags=re.S)
c=re.sub(r'<h([1-6])[^>]*?(?:id="([^"]*)")?[^>]*>',lambda mm:'\n\n#'*1+'#'*int(mm.group(1))+' ['+(mm.group(2) or '')+'] ',c)
c=re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>',lambda mm:mm.group(2)+' <'+mm.group(1)+'>',c,flags=re.S)
c=re.sub(r'<legend[^>]*>',' [legend: ',c); c=re.sub(r'</legend>',']',c)
c=re.sub(r'<(br|p|li|div|pre|tr|fieldset)[^>]*>','\n',c)
c=re.sub(r'<[^>]+>','',c); c=html.unescape(c)
c=re.sub(r'[ \t]+',' ',c); c=re.sub(r'\n\s*\n+','\n\n',c)
print(c.strip())
