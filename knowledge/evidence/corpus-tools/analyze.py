import sys, os, re, json
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from getcss import get

KF_LIKE = ('@keyframes', '@-webkit-keyframes', '@-moz-keyframes', '@font-face', '@property',
           '@page', '@counter-style', '@font-feature-values')


def strip_comments_strings(s):
    """Return (code with comments blanked and strings replaced by "S", list of comments)."""
    out = []; comments = []; i = 0; n = len(s)
    while i < n:
        c = s[i]
        if s.startswith('/*', i):
            j = s.find('*/', i + 2); j = n if j < 0 else j + 2
            comments.append(s[i:j]); out.append(' '); i = j; continue
        if c in '"\'':
            j = i + 1
            while j < n and s[j] != c:
                if s[j] == '\\': j += 1
                elif s[j] == '\n': break
                j += 1
            out.append('"S"'); i = j + 1; continue
        out.append(c); i += 1
    return ''.join(out), comments


def split_top(sel):
    parts = []; depth = 0; cur = ''
    for ch in sel:
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == ',' and depth == 0: parts.append(cur); cur = ''
        else: cur += ch
    parts.append(cur)
    return [p.strip() for p in parts if p.strip()]


def walk(code):
    """Return (blocks, statements). blocks: (kind, prelude, parent_kinds, parent_preludes)."""
    stack = []; prelude = ''; blocks = []; stmts = []
    for ch in code:
        if ch == '{':
            p = prelude.strip(); kind = 'at' if p.startswith('@') else 'style'
            blocks.append((kind, p, [k for k, _ in stack], [pp for _, pp in stack]))
            stack.append((kind, p)); prelude = ''
        elif ch == '}':
            if stack: stack.pop()
            prelude = ''
        elif ch == ';':
            p = prelude.strip()
            if p.startswith('@'): stmts.append((p, len(stack)))
            prelude = ''
        else:
            prelude += ch
    return blocks, stmts


def analyze(css_bytes, kind, name):
    s = css_bytes.decode('utf-8', errors='replace')
    r = {'name': name, 'kind': kind}
    r['bytes'] = len(css_bytes); r['chars'] = len(s)
    r['utf16'] = len(s.encode('utf-16-le')) // 2
    r['crlf'] = s.count('\r\n'); r['lf_only'] = s.count('\n') - r['crlf']; r['cr_only'] = s.count('\r') - r['crlf']
    r['chars_lf_norm'] = len(s.replace('\r\n', '\n'))
    r['nonascii'] = sum(1 for c in s if ord(c) > 127)
    r['nonascii_sample'] = ''.join(sorted(set(c for c in s if ord(c) > 127)))[:40]
    r['astral'] = sum(1 for c in s if ord(c) > 0xFFFF)
    r['nbsp'] = s.count(' '); r['bom'] = s.count('﻿'); r['zwsp'] = s.count('​')
    r['replacement_char'] = s.count('�')
    r['html_entities'] = {e: s.count(e) for e in ['&gt;', '&lt;', '&amp;', '&quot;', '&#39;', '&#x27;', '&#']}
    r['raw_gt'] = s.count('>'); r['raw_lt'] = s.count('<'); r['raw_amp'] = s.count('&')
    r['raw_dq'] = s.count('"'); r['raw_sq'] = s.count("'")
    code, comments = strip_comments_strings(s)
    r['code_gt'] = code.count('>')  # '>' outside comments/strings: combinators
    r['comments'] = len(comments); r['comment_bytes'] = sum(len(c.encode()) for c in comments)
    r['ws_ratio'] = round(sum(1 for c in s if c.isspace()) / max(1, len(s)), 3)
    lines = s.split('\n'); r['lines'] = len(lines); r['max_line'] = max(len(l) for l in lines)
    r['minified'] = (r['lf_only'] + r['crlf'] == 0) or (len(s) / max(1, len(lines)) > 300)
    r['leading_ws'] = len(s) - len(s.lstrip()); r['trailing_ws'] = len(s) - len(s.rstrip())
    blocks, stmts = walk(code)
    atn = lambda p: (re.match(r'@([\w-]+)', p).group(1).lower() if re.match(r'@([\w-]+)', p) else '?')
    r['at_blocks'] = dict(Counter(atn(p) for k, p, _, _ in blocks if k == 'at'))
    r['at_stmts'] = dict(Counter(atn(p) for p, _ in stmts))
    r['nesting_rules'] = sum(1 for k, p, par, _ in blocks if par and par[-1] == 'style')
    r['amp_nesting'] = len(re.findall(r'(^|[\s{;,(])&', code))
    imps = re.findall(r'@import\s+(?:url\()?\s*["\']?([^"\')\s;]+)', s, re.I)
    r['imports'] = imps
    fi = code.find('@import'); fb = code.find('{')
    r['import_after_rule'] = bool(imps) and fb >= 0 and fi > fb
    ff = re.findall(r'@font-face\s*{([^}]*)}', s, re.I)
    r['font_face'] = len(ff)
    r['font_srcs'] = re.findall(r'url\(\s*["\']?([a-zA-Z]+:[^"\')]{0,70})', ' '.join(ff))
    urls = re.findall(r'url\(\s*(["\']?)(.*?)\1\s*\)', s, re.I | re.S)
    r['url_count'] = len(urls)
    data = [u for _, u in urls if u.lower().startswith('data:')]
    r['data_uris'] = len(data); r['data_uri_bytes'] = [len(d.encode()) for d in data]
    r['data_mimes'] = [(re.match(r'data:([^;,]*)', d, re.I).group(1) or '?') for d in data]
    r['url_hosts'] = sorted(set(re.match(r'https?://([^/]+)', u, re.I).group(1).lower()
                                for _, u in urls if re.match(r'https?://', u, re.I)))
    r['http_urls'] = [u[:80] for _, u in urls if u.lower().startswith('http://')]
    r['scheme_relative'] = [u[:80] for _, u in urls if u.startswith('//')]
    r['important'] = len(re.findall(r'!\s*important', code, re.I))
    for pc in ['has', 'is', 'where', 'not', 'nth-child', 'focus-visible', 'focus-within', 'hover', 'root']:
        r['pc_' + pc] = len(re.findall(r':' + pc + r'(?![\w-])', code))
    r['pseudo_el'] = len(re.findall(r'::?(?:before|after)\b', code))
    r['vendor'] = {v: len(re.findall(r'(?<![\w-])' + v + r'[a-z]', code)) for v in ['-webkit-', '-moz-', '-ms-', '-o-']}
    r['custom_props_defined'] = len(re.findall(r'(?<![\w-])--[\w-]+\s*:', code))
    r['var_uses'] = len(re.findall(r'var\(\s*--', code))
    r['itchio_vars'] = sorted(set(re.findall(r'--itchio_\w+', s)))
    r['css_escapes'] = len(re.findall(r'\\[0-9a-fA-F]{1,6}', s))
    r['animation_props'] = len(re.findall(r'(?<![\w-])animation(?:-name)?\s*:', code))
    r['transition_props'] = len(re.findall(r'(?<![\w-])transition\s*:', code))
    r['backdrop_filter'] = len(re.findall(r'backdrop-filter', code))
    r['reduced_motion'] = len(re.findall(r'prefers-reduced-motion', code))
    r['color_scheme_mq'] = len(re.findall(r'prefers-color-scheme', code))
    r['modern_fns'] = {f: len(re.findall(r'(?<![\w-])' + f + r'\(', code)) for f in
                       ['clamp', 'min', 'max', 'calc', 'color-mix', 'light-dark', 'oklch', 'env', 'attr', 'random', 'sin', 'cos']}
    r['modern_units'] = {u: len(re.findall(r'\d' + u + r'\b', code)) for u in ['dvh', 'svh', 'lvh', 'cqw', 'cqi', 'vw', 'vh', 'rem', 'ch']}
    # selector scoping: style rules not nested in another style rule and not inside keyframes etc.
    style_sels = []
    for k, p, par, parp in blocks:
        if k != 'style': continue
        if 'style' in par: continue
        if any(pp.lower().startswith(KF_LIKE) for pp in parp): continue
        style_sels.extend(split_top(p))
    r['top_selectors'] = len(style_sels)
    unsc = [x for x in style_sels if '#wrapper' not in x]
    r['unscoped_selectors'] = len(unsc)
    r['unscoped_examples'] = unsc[:8]
    r['sel_root_html_body'] = sum(1 for x in style_sels if re.match(r'^(:root|html|body)(?![\w-])', x, re.I))
    r['sel_root_html_body_ex'] = [x for x in style_sels if re.match(r'^(:root|html|body)(?![\w-])', x, re.I)][:5]
    r['sel_star'] = sum(1 for x in style_sels if x.startswith('*'))
    r['sel_bare_element'] = sum(1 for x in style_sels if re.match(r'^[a-z][a-z0-9]*([\s>+~:\[.#]|$)', x) and not x.startswith(('html', 'body')))
    r['wrapper_refs'] = s.count('#wrapper')
    r['custom_class_refs'] = len(re.findall(r'\.custom-[\w-]+', code))
    r['custom_noh_refs'] = len(re.findall(r'\.custom(?!-)\w+', code))
    r['footer_refs'] = len(re.findall(r'\.footer\b|#footer\b', code))
    r['display_none'] = len(re.findall(r'display\s*:\s*none', code))
    return r


if __name__ == '__main__':
    rows = []
    for f in sys.argv[1:]:
        g = get(f); n = os.path.basename(f).replace('.html', '')
        if g is None: continue
        src, css = g
        if src == 'jam_theme_tail' and len(css.strip()) == 0: continue
        kind = {'p': 'profile', 'g': 'project', 'j': 'jam'}[n[0]]
        rr = analyze(css, kind, n); rr['container'] = src
        rows.append(rr)
    json.dump(rows, open(os.environ.get('OUT', 'corpus.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(rows), 'pages')
