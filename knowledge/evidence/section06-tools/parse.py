import sys, re, html, os
sys.stdout.reconfigure(encoding="utf-8")
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8', errors='replace').read()
    m = re.search(r'<section id="results">(.*?)</section>', s, re.S)
    print('=====', os.path.basename(f), len(s), 'bytes')
    if not m:
        print('NO RESULTS'); continue
    sec = m.group(1)
    t = re.search(r'<h2 class="results-title">(.*?)</h2>', sec)
    ua = re.search(r'<p class="results-ua">(.*?)</p>', sec)
    print(html.unescape(t.group(1)) if t else '?', '|', html.unescape(ua.group(1)) if ua else '')
    for row in re.findall(r'<tr class="r-\w+">(.*?)</tr>', sec, re.S):
        cells = [html.unescape(re.sub('<[^>]+>', '', c)) for c in re.findall(r'<td>(.*?)</td>', row, re.S)]
        print(' | '.join(cells))
