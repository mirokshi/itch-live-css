# Build framework variants for the itch-like lab (section 08 re-check, 2026-10-14).
# usage: python -I build.py <raw_dir> <www_dir>
import re, sys, os
raw, www = sys.argv[1], sys.argv[2]
def rd(n): return open(os.path.join(raw, n), encoding='utf-8').read()
def wr(n, s): open(os.path.join(www, n), 'w', encoding='utf-8', newline='\n').write(s)
def clean(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    return re.sub(r'^\s*@charset\s+"[^"]*";', '', css)
def split_top(css):
    """split top-level @keyframes/@-webkit-keyframes/@font-face blocks (hoisted) from the rest"""
    keep, hoist, i, n = [], [], 0, len(css)
    while i < n:
        m = re.compile(r'@(-webkit-)?keyframes\s|@font-face').search(css, i)
        if not m: keep.append(css[i:]); break
        # only hoist if at top level (depth 0 at m.start())
        depth = css.count('{', 0, m.start()) - css.count('}', 0, m.start())
        if depth != 0:
            keep.append(css[i:m.end()]); i = m.end(); continue
        keep.append(css[i:m.start()])
        j = css.index('{', m.start()); d = 1; k = j + 1
        while d:
            if css[k] == '{': d += 1
            elif css[k] == '}': d -= 1
            k += 1
        hoist.append(css[m.start():k]); i = k
    return ''.join(keep), ''.join(hoist)
def remap_roots(css, root_word):
    # whole-selector remaps of global roots (Bootstrap shapes)
    css = css.replace(':root,[data-bs-theme=light]{', root_word + ',' + root_word.replace(':scope', ':scope') + '[data-bs-theme=light]{')
    css = re.sub(r'(?<=[},])\[data-bs-theme=dark\]\{', lambda m: root_word + '[data-bs-theme=dark]{', css)
    css = re.sub(r'(^|[}])\s*:root\{', lambda m: m.group(1) + root_word + '{', css)
    css = re.sub(r'(^|[}])\s*body\{', lambda m: m.group(1) + root_word + '{', css)
    return css
bs = clean(rd('bootstrap_5.3.3_dist_css_bootstrap.min.css'))
an = clean(rd('animate.css_4.1.1_animate.min.css'))
tw = rd('tailwindcss_4.1.13_index.css')
wr('bootstrap.css', bs); wr('animate.css', an); wr('tw-index.css', tw)
# naive wraps (everything nested, keyframes included)
wr('bootstrap-wrapped.css', '#wrapper{' + bs + '}')
wr('animate-wrapped.css', '#wrapper{' + an + '}')
wr('animate-atscope.css', '@scope (#wrapper){' + an + '}')
# scoped Bootstrap: roots -> &, keyframes hoisted to top level
rest, hoisted = split_top(bs)
wr('bootstrap-scoped.css', '#wrapper{' + remap_roots(rest, '&') + '}' + hoisted)
wr('bootstrap-atscope.css', '@scope (#wrapper){' + remap_roots(rest, ':scope') + '}' + hoisted)
# Animate.css with every keyframe renamed custom-<name>, still top level
names = sorted(set(re.findall(r'@(?:-webkit-)?keyframes\s+([A-Za-z0-9_-]+)', an)), key=len, reverse=True)
ren = an
for nm in names:
    ren = re.sub(r'(@(?:-webkit-)?keyframes\s+)' + re.escape(nm) + r'(?=\{)', r'\1custom-' + nm, ren)
    ren = re.sub(r'(animation-name:)' + re.escape(nm) + r'(?=[;}])', r'\1custom-' + nm, ren)
wr('animate-renamed.css', ren)
print('hoisted bootstrap blocks:', hoisted.count('@keyframes'), 'renamed animate keyframes:', len(names))
print('remaining nested @keyframes in bootstrap-scoped:', ('#wrapper{' + remap_roots(rest, '&') + '}').count('@keyframes'))
for n in sorted(os.listdir(www)):
    if n.endswith('.css'): print(n, os.path.getsize(os.path.join(www, n)))
