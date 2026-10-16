import re, html, sys
# usage: totext.py in.html out.txt  -- extracts itch docs content column as text with headings
s = open(sys.argv[1], encoding='utf-8', errors='replace').read()
a = s.find('<div class="content_column">')
if a < 0: a = 0
b = s.find('<p class="social_nag">', a)
if b < 0: b = s.find('<div class="footer"', a)
t = s[a:b if b>0 else None]
t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S)
t = re.sub(r'<h([1-6])[^>]*>', lambda m: '\n\n' + '#'*int(m.group(1)) + ' ', t)
t = re.sub(r'</h[1-6]>', '\n', t)
t = re.sub(r'<li[^>]*>', '\n- ', t)
t = re.sub(r'<(p|br|div|tr|ul|ol|pre)[^>]*>', '\n', t)
t = re.sub(r'<a [^>]*href="([^"]*)"[^>]*>', r'[\1] ', t)
t = re.sub(r'<[^>]+>', '', t)
t = html.unescape(t)
t = re.sub(r'[ \t]+', ' ', t)
t = re.sub(r'\n\s*\n+', '\n\n', t)
open(sys.argv[2], 'w', encoding='utf-8').write(t.strip())
