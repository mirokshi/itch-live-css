"""Print the posts of a saved itch.io forum/blog page: role flag, date, text (HTML stripped).
Usage: python -I -X utf8 posts2.py page.html [maxchars] [grep-regex]
Author names are NOT printed (privacy); only the role flag (Admin / Moderator / user).
"""
import re, sys, html as H

path = sys.argv[1]
maxc = int(sys.argv[2]) if len(sys.argv) > 2 else 800
pat = re.compile(sys.argv[3], re.I) if len(sys.argv) > 3 else None
t = open(path, encoding='utf-8').read()

def clean(s):
    s = re.sub(r'<br\s*/?>|</p>|</li>|</h\d>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    return re.sub(r'\n{2,}', '\n', H.unescape(s)).strip()

title = re.search(r'<title>(.*?)</title>', t, re.S)
print('TITLE:', H.unescape(title.group(1)).strip() if title else '?')
heads = list(re.finditer(r'class="post_header">(.*?)</div><div class="post_content"><div class="post_body[^"]*"[^>]*>(.*?)</div>(?:<div class="post_footer"|<div class="post_footer)', t, re.S))
if not heads:
    # blog / devlog body fallback
    m = re.search(r'class="(?:post_body|blog_post|formatted)[^"]*"[^>]*>(.*?)<div class="(?:post_footer|post_meta)', t, re.S)
    d = re.search(r'title="(\d{4}-\d\d-\d\d[^"]*)"', t)
    print('DATE(first):', d.group(1) if d else '?')
    body = clean(m.group(1)) if m else clean(t)
    if pat:
        for line in body.split('\n'):
            if pat.search(line): print('  >', line[:maxc])
    else:
        print(body[:maxc])
    sys.exit()
for m in heads:
    hdr, body = m.group(1), m.group(2)
    flag = re.search(r'author_flag[^>]*>([^<]*)', hdr)
    date = re.search(r'post_date" title="([^"]*)"', hdr)
    text = clean(body)
    if pat and not pat.search(text):
        continue
    print(f'--- [{flag.group(1) if flag else "user"}] {date.group(1) if date else "?"}')
    print(text[:maxc])
