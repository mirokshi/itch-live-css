import sys, re
from urllib.parse import urlparse
def strip_comments(c): return re.sub(r'/\*.*?\*/', '', c, flags=re.S)
def selectors(c):
    c = strip_comments(c)
    # crude: capture text before '{' that is not an at-rule block
    out=[]
    for m in re.finditer(r'([^{};]+)\{', c):
        sel = m.group(1).strip()
        if sel.startswith('@') or re.match(r'^(from|to|\d+%)', sel): continue
        out.extend(s.strip() for s in sel.split(','))
    return out
for p in sys.argv[1:]:
    raw = open(p, encoding='utf-8', errors='replace').read()
    c = strip_comments(raw)
    mini = re.sub(r'\s+', ' ', c)
    sels = selectors(c)
    scoped = [s for s in sels if s.startswith('#wrapper') or s.startswith('.user_page_wrap') or s.startswith('.jam_page_wrap')]
    globalish = [s for s in sels if re.match(r'^(body|html|:root|\*)\b', s)]
    hdr = [s for s in sels if re.search(r'#header|\.header_widget|#user_tools|\.main_header|site_header', s)]
    foot = [s for s in sels if 'footer' in s]
    hosts = sorted({urlparse(u).netloc or u[:20] for u in re.findall(r'url\(\s*[\'"]?([^\'")]+)', c)})
    print(f"== {p.split('/')[-1]}: chars={len(raw)} ws-collapsed~{len(mini)} rules_sel={len(sels)} scoped#wrapper={len(scoped)} body/html/:root/*={len(globalish)} header-sel={len(hdr)} footer-sel={len(foot)} !important={c.count('!important')} @import={c.count('@import')} @font-face={c.count('@font-face')} @media={c.count('@media')} @keyframes={c.count('@keyframes')} base64={c.count('base64')} hosts={hosts}")
    if foot: print('   footer selectors:', foot[:5])
    if hdr: print('   header selectors:', hdr[:5])
    if globalish: print('   global:', globalish[:6])
