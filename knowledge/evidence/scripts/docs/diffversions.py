import re, html, sys, difflib
sys.stdout.reconfigure(encoding='utf-8')
# usage: diffversions.py a.html b.html ...  -- word diff of the guide body between consecutive versions
def body(p):
    s = open(p, encoding='utf-8', errors='replace').read()
    a = s.find('<h1>CSS Customization Guide</h1>')
    if a < 0: a = s.find('CSS Customization Guide</h1>')
    b = s.find('<p class="social_nag">', a)
    if b < 0: b = s.find('class="footer"', a)
    t = s[a:b]
    t = re.sub(r'<pre.*?</pre>', lambda m: ' [CODE] ' + re.sub(r'<[^>]+>', '', m.group(0)) + ' [/CODE] ', t, flags=re.S)
    t = re.sub(r'<h(\d)[^>]*>', lambda m: ' [H' + m.group(1) + '] ', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = html.unescape(t).replace('’', "'")
    return re.sub(r'\s+', ' ', t).strip().split(' ')
files = sys.argv[1:]
prev = None
for f in files:
    w = body(f)
    print('#' * 10, f, 'words:', len(w))
    if prev:
        sm = difflib.SequenceMatcher(None, prev, w, autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op != 'equal':
                print('  ', op.upper(), '| OLD:', ' '.join(prev[i1:i2])[:300], '| NEW:', ' '.join(w[j1:j2])[:700])
    prev = w
