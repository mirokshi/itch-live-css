"""Independent page inspector (verifier pass 2). usage: python -I pageinfo.py files..."""
import re, sys, os
sys.stdout.reconfigure(encoding='utf-8')
def styles(d):
    # every <style ...>...</style> with its attributes, in document order
    return [(m.start(), m.group(1), m.group(2)) for m in re.finditer(rb'<style([^>]*)>(.*?)</style>', d, re.S)]
def attr(a, k):
    m = re.search(rb'\b' + k + rb'="([^"]*)"', a); return m.group(1).decode() if m else None
for f in sys.argv[1:]:
    d = open(f, 'rb').read(); n = os.path.basename(f)
    hdr = open(f + '.headers', 'rb').read().decode('latin1') if os.path.exists(f + '.headers') else ''
    csp = [l.split(':',1)[1].strip() for l in hdr.splitlines() if l.lower().startswith('content-security-policy:')]
    st = styles(d)
    ids = [(p, attr(a, b'id')) for p, a, c in st]
    cc = [c for p, a, c in st if attr(a, b'id') == 'custom_css']
    wrap = re.search(rb'<div[^>]*\bid="wrapper"[^>]*>', d)
    links = [(m.start(), m.group(0)) for m in re.finditer(rb'<link[^>]*rel="stylesheet"[^>]*>|<link[^>]*stylesheet[^>]*>', d)]
    links = sorted(set(links))
    print('==', n, 'size', len(d))
    print('   CSP:', csp)
    print('   wrapper:', wrap.group(0).decode() if wrap else None)
    print('   styles:', [(p, i) for p, i in ids])
    print('   links:', [(p, re.search(rb'href="([^"]*)"', l).group(1).decode()[:110]) for p, l in links])
    print('   custom_css count:', len(cc), 'len bytes:', [len(c) for c in cc])
    hp = d.find(b'</head>'); print('   </head> at', hp)
