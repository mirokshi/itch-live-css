# usage: python -I fp.py topic.html  -> author [ADMIN|MOD] date id + body text
sys_ = __import__("sys"); sys_.stdout.reconfigure(encoding="utf-8", errors="replace")
import sys,re,html
raw=open(sys.argv[1],encoding='utf-8',errors='replace').read()
parts=re.split(r'(?=<div[^>]*class="[^"]*community_post[ "][^"]*"[^>]*>)',raw)
for p in parts[1:]:
    pid=re.search(r'id="post-(\d+)"',p[:400]) or re.search(r'data-post="\{&quot;id&quot;:(\d+)',p[:2000])
    au=re.search(r'class="post_author"[^>]*>.*?<a[^>]*>(.*?)</a>',p,re.S)
    flag=re.search(r'class="author_flag (\w+)"',p[:4000])
    dt=re.search(r'class="post_date"[^>]*title="([^"]+)"',p) or re.search(r'title="(\d{4}-\d\d-\d\d[^"]*)"',p)
    body=re.search(r'class="post_body user_formatted"[^>]*>(.*?)</div>\s*(?:<div class="post_footer|</div>)',p,re.S)
    txt=re.sub(r'<[^>]+>',' ',body.group(1)) if body else ''
    txt=re.sub(r'\s+',' ',html.unescape(txt)).strip()
    print('---',pid.group(1) if pid else '?', html.unescape(au.group(1)) if au else '?', '['+flag.group(1)+']' if flag else '', dt.group(1) if dt else '?')
    print(txt[:int(sys.argv[2]) if len(sys.argv)>2 else 1500])
