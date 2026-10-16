# Numbers about style#custom_css (never prints CSS): length, comments, lines, escaping, scoping, at-rules, targets.
import sys, os, re, collections
sys.path.insert(0, os.path.dirname(__file__))
from tree import load, byid
from flat import flatten
C = collections.Counter
agg = collections.defaultdict(C)
rows_out = []
TARGETS = ['header', 'screenshot', 'inner_column', 'view_game_page', 'button', 'header_buy_row', 'user_formatted',
           'formatted_description', 'uploads', 'buy_row', 'screenshot_list', 'game_comments_widget', 'columns',
           'game_devlog', 'game_info_panel_widget', 'right_col', 'left_col', 'game_devlog_post_page', 'vote_counts', 'load_iframe_btn',
           'game_frame', 'more_information_toggle', 'post_body', 'footer', 'user_tools', 'community_post', 'game_comments_page',
           'html_embed_widget', 'embed_wrapper', 'donate', 'buy_btn', 'download_btn', 'game_title', 'wrapper']
IDT = ['wrapper', 'inner_column', 'header', 'game_drop', 'download', 'view_game_footer', 'user_tools', 'purchase', 'comments', 'devlog']
for path in sys.argv[1:]:
    name = os.path.basename(path)[:-5]
    r = load(path)
    cc = byid(r, 'custom_css')
    if not cc:
        continue
    css = cc.text
    n = len(css)
    data_chars = sum(len(m) for m in re.findall(r'data:[^)"\']+', css))
    comments = len(re.findall(r'/\*.*?\*/', css, re.S))
    lines = css.count('\n') + 1
    gt_raw = '>' in re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    gt_esc = '&gt;' in css
    rows = flatten(css)
    sels = []
    for m, s, b in rows:
        if s.startswith('@') or re.match(r'^(from|to|\d+%)', s.strip()):
            continue
        if m.startswith('@keyframes'):
            continue
        for part in s.split(','):
            p = part.strip()
            if p and not re.match(r'^(from|to|[\d.]+%)$', p):
                sels.append(p)
    # keyframes inner selectors filtered roughly
    scoped = sum(1 for p in sels if p.startswith('#wrapper'))
    frac = scoped / len(sels) if sels else 0
    atr = C(re.findall(r'@([a-z-]+)', re.sub(r'/\*.*?\*/', '', css, flags=re.S)))
    first_stmt = re.sub(r'/\*.*?\*/', '', css, flags=re.S).strip()[:7]
    imp_first = ('@import' in css) and first_stmt.startswith('@import')
    hosts = C(re.findall(r'url\(\s*["\']?(https?://[^/"\')]+)', css))
    imp_hosts = C(re.findall(r'@import\s+(?:url\()?\s*["\']?(https?://[^/"\')]+)', css))
    bodyrules = sum(1 for p in sels if re.match(r'^(html|body)\b', p))
    hasrules = sum(1 for p in sels if ':has(' in p)
    tgt = set()
    for p in sels:
        for t in TARGETS:
            if re.search(r'\.' + t + r'(?![\w-])', p):
                tgt.add(t)
        for t in IDT:
            if re.search(r'#' + t + r'(?![\w-])', p):
                tgt.add('#' + t)
    for t in tgt:
        agg['targets'][t] += 1
    rows_out.append((name, n, data_chars, comments, lines, gt_raw, gt_esc, len(sels), round(frac, 2), dict(atr), imp_first, dict(imp_hosts), dict(hosts), bodyrules, hasrules))
print('name len data_chars comments lines gt_raw gt_esc nsel scoped_frac atrules import_first import_hosts url_hosts body_rules has_rules')
for x in sorted(rows_out, key=lambda x: x[1]):
    print(*x)
print('pages', len(rows_out))
print('over5120', sum(1 for x in rows_out if x[1] > 5120))
print('with comments', sum(1 for x in rows_out if x[3] > 0))
print('fully scoped', sum(1 for x in rows_out if x[8] == 1.0), 'mostly(>=.75)', sum(1 for x in rows_out if .75 <= x[8] < 1), 'mostly unscoped(<.5)', sum(1 for x in rows_out if x[8] < .5))
print('any gt escaped', sum(1 for x in rows_out if x[6]))
for t, c in agg['targets'].most_common():
    print(f'  {c:3d} {t}')
