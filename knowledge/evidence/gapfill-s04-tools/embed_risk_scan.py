"""s04-gf-07: how many sampled HTML5 project pages put a containing-block trigger on an ancestor of .game_frame.
usage: python -I embed_risk_scan.py <dir-with-raw-project-html> [...]
Counts unique view_game pages (by canonical URL), HTML5 embeds, start_maximized frames, fullscreen buttons, and
custom_css rules whose LAST compound selector targets an embed ancestor (html, body, #wrapper/.wrapper/.main,
#inner_column/.inner_column, .view_game_page/.view_html_game_page, .html_embed_widget/.embed_wrapper) without a
pseudo-element, and declares transform/translate/rotate/scale/filter/backdrop-filter/perspective/will-change/contain/
content-visibility (other than none/auto-safe values)."""
import glob, re, sys
TRIG = r'(?:-webkit-)?(?:transform|translate|rotate|scale|filter|backdrop-filter|perspective|will-change|contain|content-visibility)'
ANC = re.compile(r'^(html|body|#wrapper|\.wrapper|\.main|#inner_column|\.inner_column|\.view_game_page|\.view_html_game_page|\.html_embed_widget|\.embed_wrapper)$')
def last_compound_targets_ancestor(sel):
    sel = sel.strip()
    if '::' in sel or re.search(r':(before|after)\b', sel): return False
    last = re.split(r'[\s>+~]+', sel)[-1]
    last = re.sub(r':[a-z-]+(\([^)]*\))?', '', last)          # drop pseudo-classes
    parts = re.findall(r'(^[a-z]+|#[\w-]+|\.[\w-]+)', last)
    return any(ANC.match(p) for p in parts)
seen = {}
for d in sys.argv[1:]:
    for f in glob.glob(d + '/*.html'):
        s = open(f, encoding='utf-8', errors='replace').read()
        if 'data-page_name="view_game"' not in s: continue
        m = re.search(r'<link rel="canonical" href="([^"]+)"', s)
        key = m.group(1) if m else f
        if key in seen: continue
        cc = re.search(r'<style[^>]*id="custom_css"[^>]*>(.*?)</style>', s, re.S)
        css = re.sub(r'/\*.*?\*/', '', cc.group(1) if cc else '', flags=re.S)
        hits = []
        for sel, body in re.findall(r'([^{}]*)\{([^{}]*)\}', css):
            if sel.strip().startswith('@'): continue
            for one in sel.split(','):
                if last_compound_targets_ancestor(one):
                    for prop, val in re.findall(r'(?:^|;)\s*(' + TRIG + r')\s*:\s*([^;]*)', body):
                        v = val.strip().lower().replace('!important', '').strip()
                        if v in ('none', 'auto', 'normal', 'initial', 'unset', 'inherit', 'revert'): continue
                        hits.append(f'{one.strip()[:50]} {{{prop}:{v[:30]}}}')
        seen[key] = dict(
            embed=bool(re.search(r'class="html_embed_widget', s)) and 'class="game_frame' in s,
            start_max=bool(re.search(r'class="game_frame[^"]*start_maximized', s)),
            fs_btn=bool(re.search(r'class="[^"]*fullscreen_btn', s)),
            has_css=bool(css.strip()), hits=hits)
emb = [k for k, v in seen.items() if v['embed']]
print('unique view_game pages:', len(seen))
print('HTML5 embeds:', len(emb), '| start_maximized:', sum(seen[k]['start_max'] for k in emb),
      '| fullscreen_btn:', sum(seen[k]['fs_btn'] for k in emb), '| embed pages with custom CSS:', sum(seen[k]['has_css'] for k in emb))
risky = [k for k in emb if seen[k]['hits']]
print('embed pages with a trigger on an embed ancestor:', len(risky))
for k in risky: print('  ', seen[k]['start_max'], seen[k]['fs_btn'], seen[k]['hits'][:4])
allrisky = [k for k, v in seen.items() if v['hits']]
print('all pages (any type) with a trigger on those ancestors:', len(allrisky))
for k in allrisky:
    if k not in risky: print('  non-embed:', seen[k]['hits'][:3])
