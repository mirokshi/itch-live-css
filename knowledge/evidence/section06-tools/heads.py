# usage: python -I heads.py page.html ...
# Prints the <head> element sequence (link/style/script ids), counts !important and #id selectors
# in the theme <style>, and reports @import/@layer occurrences in the custom CSS.
import sys, re, os
sys.stdout.reconfigure(encoding="utf-8")

def strip_comments(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)

for f in sys.argv[1:]:
    s = open(f, encoding='utf-8', errors='replace').read()
    print('=====', os.path.basename(f))
    head = s[:s.lower().find('</head>')]
    seq = []
    for m in re.finditer(r'<(link|style|script)\b([^>]*)>', head, re.I):
        tag, attrs = m.group(1).lower(), m.group(2)
        idm = re.search(r'\bid="([^"]+)"', attrs)
        href = re.search(r'\b(?:href|src|data-src)="([^"]+)"', attrs)
        rel = re.search(r'\brel="([^"]+)"', attrs)
        if tag == 'link' and rel and 'stylesheet' not in rel.group(1):
            continue
        label = tag + ('#' + idm.group(1) if idm else '')
        if href:
            h = href.group(1)
            h = re.sub(r'^https?://', '', h)
            h = h.split('?')[0]
            label += '[' + h[:60] + ']'
        seq.append(label)
    print('head:', ' -> '.join(seq))
    # tail of head: what comes after custom_css / jam_theme
    for sid in ('user_theme', 'game_theme', 'jam_theme', 'custom_css'):
        m = re.search(r'<style[^>]*id="' + sid + r'"[^>]*>(.*?)</style>', s, re.S)
        if not m:
            continue
        css = strip_comments(m.group(1))
        imp = len(re.findall(r'!\s*important', css, re.I))
        # selectors with an #id (outside of declaration blocks, rough)
        sels = re.findall(r'(?:^|[{}])\s*([^{}@;]+)\{', css)
        idsel = [x.strip() for x in sels if re.search(r'#[A-Za-z_-]', x) and not re.search(r':\s*#', x)]
        nimport = len(re.findall(r'@import', css))
        nlayer = len(re.findall(r'@layer', css))
        print(f'  style#{sid}: {len(m.group(1))} chars, !important={imp}, id-selectors={len(idsel)}, @import={nimport}, @layer={nlayer}')
        if sid in ('user_theme', 'game_theme', 'jam_theme'):
            vars_ = re.findall(r'(--itchio_[a-z_]+)\s*:', css)
            print('   vars declared:', sorted(set(vars_)))
            lit = re.findall(r'([^{}]*\ba\b[^{}]*)\{[^{}]*?color:\s*(#[0-9a-fA-F]{3,8})', css)
            print('   literal link-color rules:', [x[0].strip()[:70] for x in lit][:6])
            imps = re.findall(r'([^{};]+)\{([^{}]*!important[^{}]*)\}', css)
            for sel, body in imps:
                props = re.findall(r'([a-z-]+)\s*:[^;]*!important', body)
                print('   !imp:', sel.strip()[:110], '=>', props)
