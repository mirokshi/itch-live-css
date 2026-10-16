import sys, re, html
sys.stdout.reconfigure(encoding="utf-8")
# usage: posts.py in.html  -- prints each forum post: author, [ADMIN], date, post id, body text
s=open(sys.argv[1],encoding='utf-8',errors='replace').read()
for m in re.finditer(r'<div class="post_header">(.*?)<div class="post_footer">', s, re.S):
    h=m.group(1)
    a=re.search(r'class="post_author"><a[^>]*>(.*?)</a>',h); d=re.search(r'class="post_date" title="([^"]+)"><a href="([^"]+)"',h)
    adm=' [ADMIN]' if 'author_flag admin' in h else ''
    mod=' [MOD]' if 'author_flag mod' in h else ''
    b=re.search(r'class="post_body[^"]*"[^>]*>(.*)',h,re.S)
    body=b.group(1) if b else ''
    body=re.sub(r'<(br|/p|/li|/h\d|/pre|/blockquote)[^>]*>','\n',body); body=re.sub(r'<li[^>]*>','- ',body)
    body=re.sub(r'<code[^>]*>','`',body); body=re.sub(r'</code>','`',body)
    body=html.unescape(re.sub(r'<[^>]+>','',body))
    print('=== %s%s%s | %s | %s'%(a.group(1) if a else '?',adm,mod,d.group(1) if d else '?',d.group(2) if d else '?'))
    print(re.sub(r'\n\s*\n+','\n',body).strip()); print()
