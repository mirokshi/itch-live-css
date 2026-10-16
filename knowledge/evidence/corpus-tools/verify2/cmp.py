"""live custom_css (attribute-order independent) vs source. usage: cmp.py page.html source.css"""
import re, sys, hashlib
sys.stdout.reconfigure(encoding='utf-8')
d = open(sys.argv[1], 'rb').read(); s = open(sys.argv[2], 'rb').read()
m = re.search(rb'<style\b[^>]*\bid="custom_css"[^>]*>(.*?)</style>', d, re.S)
L = m.group(1)
def nl(b): return {'crlf': b.count(b'\r\n'), 'lf_only': b.count(b'\n') - b.count(b'\r\n'), 'cr_only': b.count(b'\r') - b.count(b'\r\n')}
print('live  bytes', len(L), 'chars', len(L.decode('utf-8')), nl(L), 'head', L[:1], 'tail', L[-2:])
print('src   bytes', len(s), 'chars', len(s.decode('utf-8')), nl(s), 'head', s[:1], 'tail', s[-2:])
print('identical:', L == s)
n = lambda b: b.replace(b'\r\n', b'\n')
print('identical after CRLF->LF:', n(L) == n(s))
print('identical after CRLF->LF + strip:', n(L).strip() == n(s).strip())
print('identical after CRLF->LF + rstrip src only:', n(L) == n(s).rstrip())
if n(L).strip() != n(s).strip():
    a, b = n(L).strip(), n(s).strip()
    i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]), min(len(a), len(b)))
    print('first diff at', i, 'live:', a[i-40:i+60], '\n src:', b[i-40:i+60])
print('entities:', len(re.findall(rb'&(gt|lt|amp|quot|#\d+|#x[0-9a-f]+);', L)), 'raw >:', L.count(b'>'), 'raw <:', L.count(b'<'), 'raw &:', L.count(b'&'))
print('nonascii chars:', sorted(set(c for c in L.decode('utf-8') if ord(c) > 127))[:30])
