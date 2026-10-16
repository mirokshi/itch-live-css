"""s04-gf-15 (retry pass): second scan over the same sampled project pages as embed_risk_scan.py.
usage: python -I embed_anim_scan.py <dir-with-raw-project-html> [...]

Per unique view_game page (by canonical URL) with an HTML5 embed and custom CSS, counts:
  - custom_css rules on an embed ANCESTOR (same ancestor list as embed_risk_scan.py) that run an `animation`
    whose @keyframes animate transform / translate / rotate / scale / filter / backdrop-filter / perspective,
    split by whether the animation's fill mode keeps the end state (forwards / both) or not;
  - pages that use each trigger property ANYWHERE in their custom CSS (any selector), to show how common the
    properties are even when they sit on safe elements.
Regex-level parse (no nesting beyond one @media level); prints counts and short selector excerpts only.
"""
import glob, re, sys

ANC = re.compile(r'^(html|body|#wrapper|\.wrapper|\.main|#inner_column|\.inner_column|\.view_game_page|'
                 r'\.view_html_game_page|\.html_embed_widget|\.embed_wrapper)$')
TRIG_PROPS = ('transform', 'translate', 'rotate', 'scale', 'filter', 'backdrop-filter', 'perspective',
              'will-change', 'contain', 'content-visibility')


def targets_ancestor(sel):
    sel = sel.strip()
    if '::' in sel or re.search(r':(before|after)\b', sel):
        return False
    last = re.split(r'[\s>+~]+', sel)[-1]
    last = re.sub(r':[a-z-]+(\([^)]*\))?', '', last)
    return any(ANC.match(p) for p in re.findall(r'(^[a-z]+|#[\w-]+|\.[\w-]+)', last))


seen = {}
for d in sys.argv[1:]:
    for f in glob.glob(d + '/*.html'):
        s = open(f, encoding='utf-8', errors='replace').read()
        if 'data-page_name="view_game"' not in s:
            continue
        m = re.search(r'<link rel="canonical" href="([^"]+)"', s)
        key = m.group(1) if m else f
        if key in seen:
            continue
        embed = bool(re.search(r'class="html_embed_widget', s)) and 'class="game_frame' in s
        cc = re.search(r'<style[^>]*id="custom_css"[^>]*>(.*?)</style>', s, re.S)
        css = re.sub(r'/\*.*?\*/', '', cc.group(1) if cc else '', flags=re.S)
        # keyframes name -> set of animated trigger properties
        kf = {}
        for name, body in re.findall(r'@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}', css):
            props = set(p for p in re.findall(r'(?:^|[;{])\s*([a-z-]+)\s*:', body) if p in TRIG_PROPS)
            kf.setdefault(name, set()).update(props)
        css_wo_kf = re.sub(r'@(?:-webkit-)?keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*\s*\}', '', css)
        anywhere = set()
        anim_hits = []
        for sel, body in re.findall(r'([^{}]*)\{([^{}]*)\}', css_wo_kf):
            if sel.strip().startswith('@'):
                continue
            decls = dict((p.lower(), v.strip().lower()) for p, v in re.findall(r'(?:^|;)\s*([\w-]+)\s*:\s*([^;]*)', body))
            for p, v in decls.items():
                pp = p.replace('-webkit-', '')
                if pp in TRIG_PROPS and v.replace('!important', '').strip() not in ('none', 'auto', 'normal', 'initial', 'unset', 'inherit', 'revert'):
                    anywhere.add(pp)
            anim = decls.get('animation', '') + ' ' + decls.get('animation-name', '')
            if not anim.strip():
                continue
            names = [n for n in re.findall(r'[\w-]+', anim) if n in kf and kf[n]]
            if not names:
                continue
            fill = 'keeps-end-state' if re.search(r'\b(forwards|both)\b', anim + ' ' + decls.get('animation-fill-mode', '')) else 'ends-at-none'
            for one in sel.split(','):
                if targets_ancestor(one):
                    anim_hits.append(f'{one.strip()[:40]} animates {sorted(set().union(*(kf[n] for n in names)))} ({fill})')
        seen[key] = dict(embed=embed, has_css=bool(css.strip()), anywhere=anywhere, anim_hits=anim_hits)

emb = {k: v for k, v in seen.items() if v['embed'] and v['has_css']}
print('unique view_game pages:', len(seen), '| HTML5 embed pages with custom CSS:', len(emb))
print('embed pages whose custom CSS animates a trigger property on an embed ancestor:', sum(1 for v in emb.values() if v['anim_hits']))
for k, v in emb.items():
    for h in v['anim_hits'][:3]:
        print('   ', h)
print('embed pages using each trigger property on ANY selector:')
for p in TRIG_PROPS:
    n = sum(1 for v in emb.values() if p in v['anywhere'])
    if n:
        print(f'    {p}: {n}')
allp = {k: v for k, v in seen.items() if v['has_css']}
print('all project pages with custom CSS:', len(allp), '| using any trigger property on any selector:',
      sum(1 for v in allp.values() if v['anywhere']))
