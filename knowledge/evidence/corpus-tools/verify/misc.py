# misc independent checks over the previous corpus raw dir (argv[1]) and verify raw dir (argv[2])
import sys, re, glob, os, statistics as S
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
DIV = b'.view_jam_page .jam_filter_picker .divider{'


def get(d):
    m = re.search(rb'<style[^>]*\bid="custom_css"[^>]*>(.*?)</style>', d, re.S)
    if m:
        return m.group(1)
    jt = re.search(rb'<style[^>]*\bid="jam_theme"[^>]*>(.*?)</style>', d, re.S)
    if jt:
        t = jt.group(1); k = t.rfind(DIV)
        if k >= 0:
            tail = t[t.index(b'}', k) + 1:]
            if tail.strip():
                return tail


pages = {}
raws = {}
for f in sorted(glob.glob(sys.argv[1] + '/*.html')):
    n = os.path.basename(f)
    if n[0] not in 'gpj' or n.startswith('l_'):
        continue
    d = open(f, 'rb').read()
    if b'Just a moment' in d[:3000]:
        continue
    raws[n] = d
    c = get(d)
    if c:
        pages[n] = c
print('pages', len(pages))
nc = lambda c: re.sub(rb'/\*.*?\*/', b'', c, flags=re.S)


# top-level selectors (outside other style rules; inside @media/@supports counted)
def top_selectors(css):
    s = re.sub(rb'"[^"\n]*"|\'[^\'\n]*\'', b'""', nc(css)).decode('utf-8', 'replace')
    out = []; stack = []; buf = ''
    for ch in s:
        if ch == '{':
            pre = buf.strip(); buf = ''
            is_at = pre.startswith('@')
            in_style = any(x == 'style' for x in stack)
            in_kf = any(x == 'kf' for x in stack)
            if not is_at and not in_style and not in_kf:
                out += [p.strip() for p in pre.split(',') if p.strip()]
            stack.append('kf' if re.match(r'@(-webkit-)?keyframes', pre) else ('at' if is_at else 'style'))
        elif ch == '}':
            if stack:
                stack.pop()
            buf = ''
        elif ch == ';' and (not stack or stack[-1] == 'at'):
            buf = ''
        else:
            buf += ch
    return out


tot = 0; uns = 0; pages_uns = 0; pages_all = 0
for n, c in pages.items():
    sels = top_selectors(c)
    u = [x for x in sels if '#wrapper' not in x]
    tot += len(sels); uns += len(u)
    pages_uns += bool(u); pages_all += (bool(sels) and not u)
print(f'top-level selectors {tot}, without #wrapper {uns} ({uns / tot:.1%}); pages with >=1 unscoped {pages_uns}; pages fully scoped {pages_all}')

# whitespace ratio median
wr = [sum(1 for b in c if b in b' \t\r\n') / len(c) for c in pages.values()]
print('median whitespace ratio', round(S.median(wr), 4))

# meta charset
mc = Counter(re.search(rb'<meta charset="([^"]+)"', d).group(1) if re.search(rb'<meta charset="([^"]+)"', d) else b'none' for d in raws.values())
print('meta charset', mc)

# import hosts by page
ih = Counter()
for n, c in pages.items():
    hs = set(m.decode() for m in re.findall(rb'@import\s+(?:url\()?\s*["\']?https?://([^/"\')]+)', nc(c)))
    for h in hs:
        ih[h] += 1
    if any('jsdelivr' in h for h in hs):
        print('  jsdelivr import page:', n)
print('import hosts by page', ih)

# footer rules
for n, c in pages.items():
    for m in re.finditer(rb'([^{}]*\.footer\b[^{}]*)\{([^{}]*)\}', nc(c)):
        decl = m.group(2)
        props = sorted(set(p.decode() for p in re.findall(rb'([a-z-]+)\s*:', decl)))
        print('  footer', n, props[:12])

# !important in comments only
for n, c in pages.items():
    if re.search(rb'!\s*important', c) and not re.search(rb'!\s*important', nc(c)):
        print('  !important only in comments:', n)

# buy_btn / left_col tokens
for tok in [rb'buy_btn', rb'left_col', rb'\.button\b']:
    for n, c in pages.items():
        if not n.startswith('g_'):
            continue
        ms = re.findall(rb'[\w.#-]*' + tok + rb'[\w-]*', nc(c))
        if ms:
            print('  ', tok.decode(), n, sorted(set(x.decode() for x in ms))[:5])

# single-line pages per kind
sl = Counter(n[0] for n, c in pages.items() if b'\n' not in c)
print('single-line by kind', sl)
# data uri min/max
du = []
for n, c in pages.items():
    for m in re.finditer(rb'url\(\s*(["\']?)(data:.*?)\1\s*\)', nc(c), re.S):
        du.append((len(m.group(2)), n))
du.sort(); print('data uris', len(du), 'min', du[:2], 'max', du[-2:])
for n, c in pages.items():
    for m in re.finditer(rb'data:image/svg\+xml[^,]*,(.{0,60})', c):
        print('  svg', n, m.group(1)[:60], b'%23' in c, b'<svg' in c)
        break
