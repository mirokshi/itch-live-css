# independent extractor: python -I ext.py page.html [out.css]
import sys, re
d = open(sys.argv[1], 'rb').read()
# attribute order varies between itch responses, so never anchor on `<style id=`
ids = re.findall(rb'<style\b[^>]*\bid="([^"]+)"', d)
print('style ids:', ids)
m = re.findall(rb'<style\b[^>]*\bid="custom_css"[^>]*>(.*?)</style>', d, re.S)
print('custom_css count:', len(m))
w = re.search(rb'<div[^>]*id="wrapper"[^>]*>', d); print('wrapper:', w.group(0) if w else None)
csp = None
try:
    h = open(sys.argv[1] + '.headers', 'rb').read()
    print('CSP:', re.findall(rb'(?im)^content-security-policy:.*$', h))
except Exception as e: pass
links = re.findall(rb'<link[^>]*fonts\.googleapis[^>]*>', d); print('font links:', links)
if m:
    c = m[0]
    print('len bytes', len(c), 'chars', len(c.decode('utf-8')), 'CRLF', c.count(b'\r\n'), 'LF', c.count(b'\n'), 'head', c[:40], 'tail', c[-10:])
    if len(sys.argv) > 2: open(sys.argv[2], 'wb').write(c)
