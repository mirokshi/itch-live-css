# usage: python -I jt.py <html files...>  -> one JSON line per page with theme split + structure facts
import re, sys, json, os
DIV = re.compile(r'\.view_jam_page \.jam_filter_picker \.divider\{[^}]*\}')
for p in sys.argv[1:]:
    h = open(p, encoding='utf8', errors='replace').read()
    o = {'f': os.path.basename(p), 'len': len(h)}
    styles = re.findall(r'<style([^>]*)>(.*?)</style>', h, re.S)
    o['style_ids'] = [re.search(r'id="([^"]+)"', a).group(1) if 'id=' in a else '-' for a, _ in styles]
    jt = [b for a, b in styles if 'id="jam_theme"' in a]
    o['custom_css_el'] = h.count('id="custom_css"')
    o['wrapper'] = len(re.findall(r'id="wrapper"', h))
    m = re.search(r'<body([^>]*)>', h)
    o['body'] = m.group(1).strip() if m else None
    if jt:
        t = jt[0]
        o['jt_len'] = len(t)
        ms = list(DIV.finditer(t))
        if ms:
            cut = ms[-1].end()
            o['gen_len'] = cut
            o['custom_len'] = len(t) - cut
            o['custom_head'] = t[cut:cut + 60]
            o['n_divider'] = len(ms)
        gen = t[:ms[-1].end()] if ms else t
        o['important_in_gen'] = gen.count('!important')
        w = re.search(r'\.jam_page_wrap\{([^}]*)\}', gen)
        if w:
            o['wrap_decl'] = dict(re.findall(r'(--?[\w-]+|[a-z-]+):([^;]*)', w.group(1)))
        pw = re.search(r'\.page_widget\{([^}]*)\}', gen)
        if pw:
            o['page_widget_decl'] = dict(re.findall(r'(--[\w-]+):([^;]*)', pw.group(1)))
        r = re.search(r':root\{([^}]*)\}', gen)
        o['root'] = r.group(1) if r else None
        sel = re.findall(r'(?:^|\})([^{}]+)\{', gen)
        o['gen_selectors'] = sel
    vj = re.search(r'<div[^>]*class="(view_jam_page[^"]*)"', h)
    o['vjp_class'] = vj.group(1) if vj else None
    o['footer_div'] = len(re.findall(r'class="footer[ "]', h))
    o['itch_footer'] = h.count('class="itch_footer"')
    o['entries'] = h.count('id="entries"')
    # head order
    head = h.split('</head>')[0]
    ev = []
    for mm in re.finditer(r'<link[^>]*href="([^"]+)"[^>]*>|<style([^>]*)>|<script([^>]*)>', head):
        if mm.group(1):
            u = mm.group(1)
            if 'stylesheet' in mm.group(0): ev.append('link:' + re.sub(r'\?.*', '', u.split('/')[-1]) if 'fonts.googleapis' not in u else 'link:googlefonts')
        elif mm.group(2) is not None:
            ev.append('style#' + (re.search(r'id="([^"]+)"', mm.group(2)).group(1) if 'id=' in mm.group(2) else '-'))
        else:
            ev.append('script')
    # collapse consecutive scripts
    out = []
    for e in ev:
        if not out or out[-1] != e: out.append(e)
    o['head_order'] = out
    dp = re.search(r'data-page_name="([^"]+)"', h)
    o['page_name'] = dp.group(1) if dp else None
    o['ids_digits'] = sorted(set(re.findall(r'id="([a-z_]+_\d+)"', h)))[:12]
    o['ids_nodigit'] = sorted(set(i for i in re.findall(r'id="([^"]+)"', h) if not re.search(r'\d', i)))
    print(json.dumps(o, ensure_ascii=True))
