# Crude HTML -> text for reading docs/forum pages locally (keeps headings/list markers).
import re, sys, html
s = open(sys.argv[1], encoding='utf-8').read()
s = re.sub(r'<(script|style)\b.*?</\1>', '', s, flags=re.S)
s = re.sub(r'<h([1-6])[^>]*>', lambda m: '\n' + '#'*int(m.group(1)) + ' ', s)
s = re.sub(r'<li[^>]*>', '\n- ', s)
s = re.sub(r'<(br|p|div|tr|pre|code)\b[^>]*>', '\n', s)
s = re.sub(r'<[^>]+>', '', s)
s = html.unescape(s)
s = re.sub(r'\n\s*\n+', '\n', s)
print(s)
