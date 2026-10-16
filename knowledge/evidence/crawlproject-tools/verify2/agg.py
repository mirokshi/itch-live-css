# Aggregate DOM census over project pages. Prints counts only (no third-party text/CSS).
import sys, os, re, collections, html as H
sys.path.insert(0, os.path.dirname(__file__))
from tree import load, byid, bycls, kids
C = collections.Counter
cnt = collections.defaultdict(C)
CANON = ['formatted_description', 'more_information_toggle', 'h2#download|h2#purchase', 'bundle_row', 'buy_row',
         'uploads', 'h2#demo', 'uploads.for_demo', 'rewards', 'download_instructions', 'h2', 'app_store_links',
         'game_devlog', 'game_comments_widget|community_summary']
KEYS = ['formatted_description', 'more_information_toggle', 'bundle_row', 'buy_row', 'uploads', 'rewards',
        'download_instructions', 'app_store_links', 'game_devlog', 'game_comments_widget', 'community_summary']


def norm(n):
    if n.tag == 'h2':
        return 'h2#' + n.id if n.id else 'h2'
    c = n.cls
    if 'for_demo' in c:
        return 'uploads.for_demo'
    for k in KEYS:
        if k in c:
            return k
    return re.sub(r'_\d+', '_N', n.sig())


def rank(x):
    for i, c in enumerate(CANON):
        if x in c.split('|'):
            return i
    return None


IFR_ATTR = re.compile(r'([\w-]+)(?:=(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+)))?')
order_viol = []
pages = 0
for path in sys.argv[1:]:
    name = os.path.basename(path)[:-5]
    r = load(path)
    w = byid(r, 'wrapper')
    if not w or 'game_page_wrapper' not in w.cls:
        cnt['skipped'][name] += 1
        continue
    pages += 1
    body = [n for n in r.walk() if n.tag == 'body'][0]
    cnt['wrapper_parent'][w.up.tag] += 1
    cnt['wrapper_cls'][' '.join(sorted(w.cls))] += 1
    ic = byid(r, 'inner_column')
    cnt['inner_parent_is_wrapper'][ic.up is w] += 1
    cnt['wrapper_nkids'][len(kids(w))] += 1
    ik = kids(ic)
    cnt['inner_kids'][' | '.join(re.sub(r'#(view_game|view_html_game)_\d+', '#PW', k.sig().split('.')[0]) for k in ik)] += 1
    for c in ic.cls:
        if c.startswith('size_'):
            cnt['size'][c] += 1
        if c.startswith('family_'):
            cnt['family'][c] += 1
    base = ['game_layout_widget', 'layout_widget', 'responsive', 'no_theme_toggle', 'locale_en']
    cnt['body_extra'][' '.join(sorted(set(body.cls) - set(base)))] += 1
    cnt['body_base'][all(x in body.cls for x in base)] += 1
    cnt['page_name'][body.a.get('data-page_name')] += 1
    cnt['body_kids'][' | '.join(re.sub(r'_\d+', '_N', k.sig().split('.')[0]) for k in kids(body, ('script', 'noscript')))] += 1
    h = byid(r, 'header')
    cnt['header_cls'][' '.join(sorted(set(h.cls) - {'header'})) or '(none)'] += 1
    cnt['header_kids'][' '.join(k.tag + ('.' + '.'.join(k.cls) if k.cls else '') for k in kids(h))] += 1
    for i in [n for n in h.walk() if n.tag == 'img']:
        cnt['header_img_alt'][('has_alt' if i.a.get('alt') else 'no_alt')] += 1
    pw = [k for k in ik if 'page_widget' in k.cls][0]
    cnt['pw_flags'][' '.join(sorted(set(pw.cls) - {'view_game_page', 'page_widget', 'base_widget'}))] += 1
    cnt['pw_kids'][' > '.join(('.' + '.'.join(x for x in k.cls if x not in ('base_widget', 'html_embed_widget')) if k.cls else k.tag) for k in kids(pw))] += 1
    lc = bycls(r, 'left_col')
    rc = bycls(r, 'right_col')
    cnt['n_left_right'][(len(lc), len(rc))] += 1
    if rc:
        cnt['right_kids'][' + '.join(norm(k) for k in kids(rc[0]))] += 1
    if lc:
        seq = [norm(k) for k in kids(lc[0])]
        cnt['left_first'][seq[0] if seq else '-'] += 1
        cnt['left_seq'][' > '.join(seq)] += 1
        rk = [(x, rank(x)) for x in seq]
        bad = [(a, b) for (a, ra), (b, rb) in zip(rk, rk[1:]) if ra is not None and rb is not None and rb < ra]
        if bad:
            order_viol.append((name, bad))
        cw = 'game_comments_widget' in seq
        cs = 'community_summary' in seq
        cnt['comments'][('widget' if cw else '') + ('+board' if cs else '') or 'neither'] += 1
    sc = [n for n in r.walk() if n.tag == 'img' and 'screenshot' in n.cls]
    if sc:
        cnt['shot_alt']['all_alt' if all(n.a.get('alt') for n in sc) else 'some_alt' if any(n.a.get('alt') for n in sc) else 'no_alt'] += 1
        for n in sc:
            cnt['shot_attrs'][' '.join(sorted(n.a))] += 1
    else:
        cnt['shot_alt']['no_screens'] += 1
    gf = bycls(r, 'game_frame')
    if gf:
        g = gf[0]
        mode = ' '.join(sorted(set(g.cls) - {'game_frame'}))
        fs = any('fullscreen_btn' in k.cls for k in kids(g))
        cnt['embed_mode'][mode + (' +fs_btn' if fs else '')] += 1
        cnt['gf_inline_style'][bool(re.match(r'\s*width:\s*\d+px;\s*height:\s*\d+px', g.a.get('style', '')))] += 1
        cnt['gf_data'][('data-width' in g.a and 'data-height' in g.a)] += 1
    ifr = [n.a for n in r.walk() if n.tag == 'iframe' and 'itch.zone' in n.a.get('src', '')]
    for n in bycls(r, 'iframe_placeholder'):
        di = H.unescape(n.a.get('data-iframe', ''))
        if '<iframe' in di:
            inner = di.split('<iframe', 1)[1].split('>', 1)[0]
            d = {}
            for k, a, b, c in IFR_ATTR.findall(inner):
                d[k] = a or b or c
            ifr.append(d)
    for a in ifr:
        cnt['iframe_host'][re.sub(r'/html/.*', '', a.get('src', ''))] += 1
        cnt['iframe_sandbox']['sandbox' in a] += 1
        cnt['iframe_allow'][a.get('allow', '')] += 1
        cnt['iframe_attrs'][' '.join(sorted(k for k in a if k not in ('src', 'allow', 'id', 'style', 'width', 'height')))] += 1
    for n in r.walk():
        if n.id and not re.search(r'\d', n.id):
            cnt['ids_nonnum'][n.id] += 1
        elif n.id:
            cnt['ids_num_prefix'][re.sub(r'[-_]?\d+.*', '', n.id)] += 1
    head = [n for n in r.walk() if n.tag == 'head'][0]
    hk = kids(head, ())
    cnt['head_last'][hk[-1].sig() if hk else '-'] += 1
    seq = []
    for k in hk:
        if k.tag == 'link' and 'stylesheet' in k.a.get('rel', ''):
            hr = k.a.get('href', '')
            seq.append('gamecss' if 'game.css' in hr else 'gfont' if 'fonts.googleapis' in hr else 'link:' + hr[:30])
        elif k.tag == 'style':
            seq.append('style#' + str(k.id))
    cnt['head_css_seq'][' > '.join(seq)] += 1
    cnt['n_itch_stylesheet_links'][sum(1 for k in r.walk() if k.tag == 'link' and 'stylesheet' in k.a.get('rel', '') and 'itch.io' in k.a.get('href', ''))] += 1
    for k in hk:
        if k.tag == 'link' and 'fonts.googleapis' in k.a.get('href', ''):
            cnt['gfont_query'][re.sub(r'family=[^:%&]*', 'family=F', k.a['href'].split('?', 1)[1])] += 1
    cc = byid(r, 'custom_css')
    cnt['has_custom_css'][cc is not None] += 1
print('pages', pages)
for k, v in cnt.items():
    print('##', k)
    for a, b in v.most_common(45):
        print(f'  {b:3d}  {a}')
print('## order violations', len(order_viol))
for o in order_viol:
    print('  ', o)
