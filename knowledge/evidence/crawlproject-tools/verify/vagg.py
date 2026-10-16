"""Aggregate vdom.py JSON over project pages. usage: python -I vagg.py analysis.json"""
import sys, json, re
from collections import Counter

pages = [p for p in json.load(open(sys.argv[1], encoding='utf-8')) if p.get('page_name') == 'view_game']
print('project pages:', len(pages))
C = lambda: Counter()

def tally(name, f):
    c = Counter()
    for p in pages:
        try: c[f(p)] += 1
        except Exception as e: c['ERR ' + repr(e)[:60]] += 1
    print('\n##', name)
    for k, v in c.most_common(): print(f'  {v:3d}  {k}')

tally('wrapper sig', lambda p: p['wrapper'])
tally('inner_column classes (size/family pattern)', lambda p: re.sub(r'family_\w+', 'family_*', p['inner_column']))
tally('inner children', lambda p: ' | '.join(re.sub(r'\.(buy_on_top|direct_download|view_html_game_page|ready)', '', re.sub(r'#header\.header.*', '#header', s)) for s in p['inner_children']))
tally('header classes', lambda p: p['header'])
tally('header children', lambda p: ' '.join(p['header_children']))
tally('header img alt present', lambda p: (p['header_img_alt'] is not None, p['header_img_parent']))
tally('page widget sig', lambda p: re.sub(r'#\w+', '#..', p['page_widget']))
tally('page widget children', lambda p: ' > '.join(re.sub(r'#\w+', '', s) for s in p['page_widget_children']))
tally('columns children', lambda p: ' '.join(p['columns_children'] or ['NONE']))
tally('right_col children', lambda p: ' '.join(p['right_children'] or ['NONE']))
ORDER = ['formatted_description', 'more_information_toggle', 'h2#download|h2#purchase', 'bundle_row', 'buy_row', 'uploads', 'h2#demo', 'uploads.for_demo', 'rewards', 'download_instructions', 'app_store_links', 'game_devlog', 'game_comments_widget|community_summary']
def key(s):
    if s.startswith('h2#download') or s.startswith('h2#purchase'): return 'h2#download|h2#purchase'
    if s.startswith('h2#demo'): return 'h2#demo'
    if 'for_demo' in s: return 'uploads.for_demo'
    for k in ORDER:
        for kk in k.split('|'):
            if '.' + kk in s or s.endswith(kk): return k
    return 'OTHER:' + s
seqs = Counter(); bad = []
for p in pages:
    ks = [key(s) for s in (p['left_children'] or [])]
    seqs[' , '.join(ks)] += 1
    idx = [ORDER.index(k) if k in ORDER else -1 for k in ks]
    if -1 in idx or idx != sorted(idx): bad.append((p['file'], ks))
print('\n## left_col distinct sequences:', len(seqs))
for k, v in seqs.most_common(): print(f'  {v:3d}  {k}')
print('## left_col order violations:', bad)
tally('formatted_description parents', lambda p: ' + '.join(p['formatted_description_parents']))
tally('user_formatted parents', lambda p: ' + '.join(sorted(set(re.sub(r'#\w+', '', s) for s in p['user_formatted_parents']))))
tally('game_frame sig', lambda p: ' ; '.join(g['sig'] for g in p['game_frames']) or '-')
tally('game_frame children', lambda p: ' ; '.join(' '.join(g['children']) for g in p['game_frames']) or '-')
tally('game_frame inline style', lambda p: ' ; '.join(re.sub(r'\d+', 'N', g['style'] or 'NONE') for g in p['game_frames']) or '-')
tally('game iframes attrs', lambda p: ' ; '.join(','.join(sorted(k for k in f if k not in ('parent',))) for f in p['iframes'] if 'game_frame' in f['parent'] or f.get('id') == 'game_drop') or '-')
tally('game iframe src host', lambda p: ' ; '.join(re.sub(r'/html/\d+/.*', '/html/N/…', f.get('src', '')) for f in p['iframes'] if f.get('id') == 'game_drop') or '-')
tally('placeholder data-iframe src host', lambda p: ' ; '.join(re.findall(r'src=.(https?://[^/]+)', ph['di'])[0] if re.findall(r'src=.(https?://[^/]+)', ph['di']) else 'nosrc' for ph in p['placeholders']) or '-')
tally('screenshot imgs with alt / total', lambda p: (p['n_screenshot_with_alt'], p['n_screenshot_imgs'] > 0))
tally('body classes (sorted)', lambda p: ' '.join(sorted(p['body_class'])))
tally('body children', lambda p: ' '.join(re.sub(r'#\w+_N', '#x_N', s) for s in p['body_children'] if s != 'script' and not s.startswith('script')))
tally('head order (filtered)', lambda p: ' '.join(re.sub(r'link:https://(static.itch.io/game.css|fonts.googleapis.com/css).*', r'L:\1', h) for h in p['head'] if h.startswith('style') or 'game.css' in h or 'fonts.googleapis' in h))
tally('custom_css last in head (if present)', lambda p: (p['custom_css_len'] is not None, p['custom_css_last_in_head']))
tally('more_info children', lambda p: ' '.join(p['more_info'] or ['NONE']))
tally('more_info tree', lambda p: ' '.join(re.sub(r'#\w+', '', s) for s in (p.get('more_info_tree') or [])[:9]))
tally('comments widget vs summary', lambda p: (p['comments_widget'], p['community_summary']))
lab = Counter()
for p in pages:
    for l in set(p.get('info_labels') or []): lab[l] += 1
print('\n## info labels', lab.most_common())
idc = Counter()
for p in pages:
    for i in p['ids']: idc[i] += 1
print('\n## ids', idc.most_common())
tally('user_tools parent', lambda p: p['user_tools_parent'])
tally('donate', lambda p: json.dumps(p['donate']))
tally('header_buy_row', lambda p: json.dumps([h['parent'][:30] for h in p['header_buy_row']]))
tally('video_embed', lambda p: json.dumps([(re.sub(r'#\w+', '', v['sig']), re.sub(r'#\w+', '', v['parent'])[:40], len(v['kids'])) for v in p['video_embed']]))
tally('uploads kids', lambda p: json.dumps([u['kids'] for u in p['uploads']][:1]))
tally('upload name', lambda p: json.dumps([u['name'] for u in p['uploads']][:1]))
tally('buy_row msg', lambda p: json.dumps([b['msg'] for b in p['buy_rows']][:1]))
tally('n buy rows', lambda p: p['n_buy_row'])
tally('comments widget children', lambda p: ' '.join(re.sub(r'#\w+', '', s) for s in (p['comments_widget_children'] or ['-'])))
tally('community_post tree', lambda p: ' '.join(re.sub(r'#[\w-]+', '', s) for s in (p['community_post_tree'] or ['-'])[:14]))
