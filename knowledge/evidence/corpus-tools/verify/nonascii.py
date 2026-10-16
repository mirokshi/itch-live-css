# list non-ASCII code points per page with custom CSS (prev corpus raw dir)
import sys, re, glob, os
sys.stdout.reconfigure(encoding='utf-8')
DIV = b'.view_jam_page .jam_filter_picker .divider{'
for f in sorted(glob.glob(sys.argv[1] + '/*.html')):
    n = os.path.basename(f)
    if n[0] not in 'gpj':
        continue
    d = open(f, 'rb').read()
    m = re.search(rb'<style[^>]*id="custom_css"[^>]*>(.*?)</style>', d, re.S)
    c = m.group(1) if m else None
    if c is None:
        jt = re.search(rb'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>', d, re.S)
        if jt:
            t = jt.group(1); k = t.rfind(DIV)
            if k >= 0:
                c = t[t.index(b'}', k) + 1:]
    if not c:
        continue
    s = c.decode('utf-8')
    na = sorted(set(ch for ch in s if ord(ch) > 127))
    if na:
        kanji = [ch for ch in na if 0x4E00 <= ord(ch) <= 0x9FFF]
        kana = [ch for ch in na if 0x3040 <= ord(ch) <= 0x30FF]
        print(n, 'n_distinct', len(na), 'kanji', len(kanji), 'kana', len(kana), ' '.join('U+%04X' % ord(ch) for ch in na[:14]))
