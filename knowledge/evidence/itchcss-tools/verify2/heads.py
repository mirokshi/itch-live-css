import sys, re, hashlib
sys.stdout.reconfigure(encoding='utf-8')
for f in sys.argv[1:]:
    s = open(f, encoding='utf8', errors='replace').read()
    head_end = s.find('</head>')
    print('==', f.split('/')[-1], 'len', len(s), '</head> at', head_end)
    for m in re.finditer(r'<link\b[^>]*>|<style\b([^>]*)>(.*?)</style>', s, re.S | re.I):
        t = m.group(0)
        where = 'HEAD' if m.start() < head_end else 'BODY'
        if t.lower().startswith('<link'):
            if 'stylesheet' not in t: continue
            h = re.search(r'href="([^"]+)"', t)
            print('  ', where, 'LINK', h.group(1) if h else t)
        else:
            attrs = m.group(1); body = m.group(2)
            print('  ', where, 'STYLE', attrs.strip(), 'len', len(body), 'sha1', hashlib.sha1(body.encode()).hexdigest()[:12], '@import at', body.find('@import'))
    b = re.search(r'<body\b[^>]*>', s); print('   body:', b.group(0) if b else None)
    w = re.search(r'<[a-z]+\b[^>]*id="wrapper"[^>]*>', s); print('   wrapper:', w.group(0)[:200] if w else None)
    print('   inline style= count:', len(re.findall(r'\sstyle="', s)), '| <script> count:', len(re.findall(r'<script\b', s)))
