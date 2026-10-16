import sys, re, html
def txt(h):
    h = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S)
    h = re.sub(r'<br\s*/?>|</p>|</li>|</div>|</h\d>|</pre>', '\n', h)
    h = re.sub(r'<[^>]+>', '', h)
    return re.sub(r'\n\s*\n+', '\n', html.unescape(h)).strip()
s = open(sys.argv[1], encoding='utf-8').read()
maxc = int(sys.argv[2]) if len(sys.argv) > 2 else 1500
t = re.search(r'<title>(.*?)</title>', s, re.S); print('TITLE:', html.unescape(t.group(1)) if t else None)
posts = re.split(r'<div[^>]*class="[^"]*community_post\b', s)
if len(posts) <= 1:
    m = re.search(r'<div class="[^"]*(blog_post|formatted_description|post_body|page_widget)[^"]*"', s)
    body = s[m.start():] if m else s
    print(txt(body)[:maxc]); sys.exit()
for p in posts[1:]:
    pid = re.search(r'id="post-(\d+)"', p[:400]) or re.search(r'data-post="\{[^}]*?&quot;id&quot;:(\d+)', p[:2000])
    au = re.search(r'class="post_author"[^>]*>\s*<a[^>]*>(.*?)</a>', p, re.S)
    date = re.search(r'class="post_date"[^>]*title="([^"]+)"', p)
    tags = re.findall(r'<span class="[^"]*(?:mod_tag|admin_tag|post_author_tag|tag)[^"]*"[^>]*>(.*?)</span>', p[:3000])
    body = re.search(r'class="post_body[^"]*">(.*?)</div>\s*<div class="post_footer', p, re.S)
    print('--- post', pid.group(1) if pid else '?', '|', html.unescape(au.group(1)).strip() if au else '?', '|', date.group(1) if date else '?', '|', [re.sub('<[^>]+>','',x) for x in tags][:4])
    print(txt(body.group(1) if body else p)[:maxc])
