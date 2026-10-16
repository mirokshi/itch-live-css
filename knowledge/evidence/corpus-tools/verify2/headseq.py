import re, sys
sys.stdout.reconfigure(encoding='utf-8')
for f in sys.argv[1:]:
    d = open(f, 'rb').read(); h = d[:d.find(b'</head>')]
    seq = []
    for m in re.finditer(rb'<(link|script|style|meta)\b([^>]*)>', h):
        t = m.group(1).decode(); a = m.group(2)
        if t == 'meta':
            if b'charset' in a: seq.append('meta[charset=%s]' % re.search(rb'charset="?([^"\s/]+)', a).group(1).decode())
            continue
        if t == 'link' and b'stylesheet' not in a: continue
        i = re.search(rb'id="([^"]*)"', a); hr = re.search(rb'(?:href|src)="([^"]*)"', a)
        seq.append(t + ('#' + i.group(1).decode() if i else '') + ('(' + re.sub(r'\?.*', '', hr.group(1).decode())[-40:] + ')' if hr else ''))
    print(f.split('/')[-1], ' -> '.join(seq))
