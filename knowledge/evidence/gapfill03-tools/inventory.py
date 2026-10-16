"""Inventory of project-family captures (view_game, game.devlog, game.devlog_post, game.comments).
usage: python -I inventory.py <glob> [<glob> ...]   -> TSV on stdout (numbers/classes only, no text)
Columns: page_name, canonical url, header?, header classes, page-widget classes, has_devlog_section,
first devlog post link, big_video, direct_download, buy_on_top, kind hints (from info panel row labels / classes)."""
import sys, glob, re, os

def attr(tag, name):
    m = re.search(r'\b' + name + r'="([^"]*)"', tag)
    return m.group(1) if m else None

rows = {}
for g in sys.argv[1:]:
    for f in sorted(glob.glob(g)):
        try:
            t = open(f, encoding='utf-8', errors='replace').read()
        except Exception:
            continue
        b = re.search(r'<body[^>]*>', t)
        if not b: continue
        pn = attr(b.group(0), 'data-page_name')
        if pn not in ('view_game', 'game.devlog', 'game.devlog_post', 'game.comments'): continue
        can = re.search(r'<link[^>]*rel="canonical"[^>]*>', t)
        url = attr(can.group(0), 'href') if can else None
        if not url:
            og = re.search(r'<meta[^>]*property="og:url"[^>]*>', t)
            url = attr(og.group(0), 'content') if og else os.path.basename(f)
        w = t.find('id="wrapper"')
        hdr = re.search(r'<div[^>]*\bid="header"[^>]*>', t)
        hcls = attr(hdr.group(0), 'class') if hdr else '-'
        pw = re.search(r'<div[^>]*class="([^"]*\bpage_widget\b[^"]*)"', t[w:] if w > 0 else t)
        pwc = re.sub(r'\b(page_widget|base_widget)\b', '', pw.group(1)).split() if pw else []
        devsec = 'section id="devlog"' in t or 'class="game_devlog"' in t
        post = re.search(r'href="(https://[a-z0-9-]+\.itch\.io/[^"/]+/devlog/\d+/[^"]+)"', t)
        labels = re.findall(r'<tr><td>([A-Za-z ]+)</td>', t)
        kind = []
        for lab in ('Category', 'Genre', 'Platforms', 'Format', 'Pages', 'Length'):
            if lab in labels: kind.append(lab)
        key = (pn, url)
        rows[key] = [pn, url or '?', 'header' if hdr else 'NO_HEADER', hcls,
                     '.'.join(c for c in pwc if c not in ('view_game_page',)) or '-',
                     'devlog' if devsec else '-', post.group(1) if post else '-',
                     'big_video' if 'big_video' in t else '-',
                     'direct_download' if re.search(r'class="[^"]*\bdirect_download\b', t) else '-',
                     ','.join(kind) or '-', f]
for k in sorted(rows):
    print('\t'.join(rows[k]))
