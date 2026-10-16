import re, html, sys
sys.stdout.reconfigure(encoding="utf-8")
# usage: posts.py topic.html  -- prints each community post: author, flags (admin/mod), date, body text
s = open(sys.argv[1], encoding='utf-8', errors='replace').read()
t = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
parts = re.split(r'(?=<div[^>]*class="community_post[ "])', s)[1:]
for p in parts:
    a = re.search(r'class="post_author">(.*?)</div>', p, re.S)
    author = re.sub(r'<[^>]+>', ' ', a.group(1)).strip() if a else '?'
    author = re.sub(r'\s+', ' ', html.unescape(author))
    d = re.search(r'title="(20\d\d-[^"]*)"', p)
    badges = re.findall(r'class="([^"]*(?:admin|mod|staff|dev)[^"]*)"', p[:3000])
    b = re.search(r'class="post_body user_formatted"[^>]*>(.*?)</div><div class="post_footer', p, re.S)
    body = b.group(1) if b else ''
    body = re.sub(r'<pre[^>]*>', '\n```\n', body); body = body.replace('</pre>', '\n```\n')
    body = re.sub(r'<li[^>]*>', '\n- ', body)
    body = re.sub(r'<(p|br|h\d|ul|ol)[^>]*>', '\n', body)
    body = re.sub(r'<a [^>]*href="([^"]*)"[^>]*>', r'[\1] ', body)
    body = re.sub(r'<[^>]+>', '', body)
    body = re.sub(r'\n\s*\n+', '\n', html.unescape(body)).strip()
    print('=' * 70)
    print('AUTHOR:', author, '| DATE:', d.group(1) if d else '?', '| BADGES:', sorted(set(badges))[:6])
    print(body)
