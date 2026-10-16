"""Direct-download census: for every distinct project main page whose page widget has .direct_download,
print the children of .header_buy_row and of .direct_download_row, whether a .buy_row exists anywhere,
how many a.download_btn sit in the main (non-demo) .uploads list, and the embed flag.
usage: python -I ddl.py "<glob>" [...]     (class names and counts only)"""
import sys, glob, re, os
seen = {}
for g in sys.argv[1:]:
    for f in glob.glob(g):
        t = open(f, encoding='utf-8', errors='replace').read()
        if 'data-page_name="view_game"' not in t[:20000] and 'data-page_name="view_game"' not in t: continue
        pw = re.search(r'<div[^>]*class="([^"]*\bview_game_page\b[^"]*)"', t)
        if not pw or 'direct_download' not in pw.group(1).split(): continue
        key = re.search(r'https://[a-z0-9-]+\.itch\.io/[a-z0-9-]+(?=/(?:devlog|comments|purchase|community|download))', t)
        key = key.group(0) if key else os.path.basename(f)
        if key in seen: continue
        hbr = re.search(r'<div class="header_buy_row">(.*?)</div>\s*(?:<div class="(?:video_embed|columns))', t, re.S)
        inner = hbr.group(1) if hbr else ''
        kids = re.findall(r'<(p|div|button|a)\b[^>]*?(?:class="([^"]*)")?[^>]*>', inner)
        btn = re.search(r'<button[^>]*class="([^"]*direct_download_btn[^"]*)"', inner)
        main_uploads = re.search(r'<div class="uploads">(.*?)</div>\s*</div>\s*(?:<div class="uploads for_demo|<div class="|<section|<h2)', t, re.S)
        seen[key] = dict(file=os.path.basename(f), html5='view_html_game_page' in pw.group(1),
                         header_buy_row=bool(hbr), hbr_classes=sorted({c for _, c in kids if c}),
                         ddl_btn=btn.group(1) if btn else '-', buy_row=t.count('class="buy_row"'),
                         download_btn=t.count('download_btn"') + t.count('download_btn '))
for k, v in sorted(seen.items()):
    print(k.split('//')[-1][:50].ljust(52), v)
print('distinct direct_download pages:', len(seen))
