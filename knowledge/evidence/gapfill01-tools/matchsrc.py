# Compare a live custom_css block with candidate source files (one per commit).
# Normalisation: CRLF->LF on both sides, then strip trailing whitespace. Prints sizes and equality only.
# usage: python -I matchsrc.py page.html src1.css [src2.css ...]
import re, sys
b = open(sys.argv[1], 'rb').read()
m = re.search(rb'<style\b[^>]*\bid="custom_css"[^>]*>(.*?)</style>', b, re.S)
live = m.group(1).decode('utf-8')
norm = lambda t: t.replace('\r\n', '\n').rstrip()
L = norm(live)
print('live: bytes', len(m.group(1)), 'chars', len(live), 'CR', live.count('\r'), 'norm chars', len(L), 'leading ws', len(live) - len(live.lstrip()))
for f in sys.argv[2:]:
    t = open(f, encoding='utf-8').read() if open(f,'rb').read() else ''
    T = norm(t)
    same = T == L
    pref = 0
    for a, c in zip(T, L):
        if a != c: break
        pref += 1
    print(f"{f.split('/')[-1]:40} src_bytes={len(t.encode()):6} src_LF={t.count(chr(10)):4} src_CR={t.count(chr(13)):3} equal={same} common_prefix={pref}")
