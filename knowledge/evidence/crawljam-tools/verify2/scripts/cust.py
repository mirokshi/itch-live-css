# usage: python -I cust.py <overview html...> -> per-jam stats of the host custom CSS + selector classes (own classifier)
import re, sys, os, collections
DIV = re.compile(r'\.view_jam_page \.jam_filter_picker \.divider\{[^}]*\}')
tot = collections.Counter(); ex = collections.defaultdict(set)
def selectors(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out = []
    def walk(s):
        i = 0
        while True:
            j = s.find('{', i)
            if j < 0: return
            head = s[i:j].strip(); d = 1; k = j + 1
            while k < len(s) and d:
                d += (s[k] == '{') - (s[k] == '}'); k += 1
            body = s[j + 1:k - 1]
            if head.startswith(('@media', '@supports', '@layer', '@container')): walk(body)
            elif head.startswith('@'): pass
            else: out.extend(x.strip() for x in head.split(',') if x.strip())
            i = k
    walk(css); return out
for p in sys.argv[1:]:
    h = open(p, encoding='utf8', errors='replace').read()
    m = re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>', h, re.S)
    t = m.group(1); c = t[list(DIV.finditer(t))[-1].end():]
    if len(c.strip()) == 0: continue
    st = dict(chars=len(c), stripped=len(c.strip()), lines=c.count('\n') + 1, comments=len(re.findall(r'/\*.*?\*/', c, re.S)),
              CR=c.count('\r'), entities=len(re.findall(r'&(?:gt|lt|amp|quot|#\d+);', c)), gt=c.count('>'), important=c.count('!important'),
              nonascii=sum(1 for ch in c if ord(ch) > 127), urls=sorted(set(re.sub(r'^https?://([^/]+).*', r'\1', u.strip('\'" ')) for u in re.findall(r'url\(([^)]*)\)', c))))
    sels = selectors(c); cls = collections.Counter()
    for s in sels:
        f = s.split()[0] if s.split() else s
        if s.startswith('#wrapper'): k = 'wrapper'
        elif re.match(r'^(html|body|:root)\b', s, re.I): k = 'html/body/:root'
        elif re.search(r'(?<![\w-])\.header_widget\b|\.primary_header\b|\.user_panel_widget\b|\.header_dropdown\b', s): k = 'site-header'
        elif re.match(r'^\.(view_jam_page|jam_page_wrap)\b', s): k = '.view_jam_page/.jam_page_wrap'
        elif re.match(r'^\.custom[-_]', s): k = 'custom'
        elif re.match(r'^\.', s): k = 'other-itch-class'
        elif re.match(r'^[a-z][a-z0-9]*\b', s, re.I) or s == '*': k = 'bare-element'
        else: k = 'other'
        cls[k] += 1; tot[k] += 1; ex[k].add(s[:50])
    print(os.path.basename(p), st, dict(cls), 'n_sel=', len(sels))
print('TOTAL', dict(tot), 'sum', sum(tot.values()))
for k in ['site-header', 'html/body/:root', 'wrapper', 'other']:
    print(k, sorted(ex[k])[:12])
