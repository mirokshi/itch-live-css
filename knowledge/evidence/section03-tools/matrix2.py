"""Selector presence matrix inside #wrapper, per page group.
usage: python -I matrix.py GROUP=glob [GROUP=glob ...]
Selectors are single compounds: tag, #id, .class combos (e.g. 'h1', '#inner_column', '.left_col.column').
Prints, per selector: pages-with-match / pages-in-group, and median count per page."""
import sys, glob, re, statistics
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
SELS = ['#inner_column', '.inner_column', '#header', '.header', '#profile_header', '.text_header', '.columns', '.left_col', '.right_col',
        '.formatted_description', '.user_formatted', '.formatted', '.footer', '#view_game_footer', '.itch_footer',
        '.page_widget', '.view_game_page', '.view_html_game_page', '.game_devlog_post_page', '.game_devlog_page',
        '.game_comments_page', '.user_page', '.user_profile', '.user_links', '.user_game_grid', '.collection_row', '.purchased_games',
        '.view_jam_page', '.jam_body', '.jam_content', '.jam_header_widget', '.jam_submitter_widget', '#entries',
        '.split_columns', '.post_header', '.post_body', '.game_metadata', '.blog_post_list_widget',
        '.game_title', 'h1.game_title', '.game_grid_widget', '.game_cell', '.game_comments_widget', '.button',
        '.header_buy_row', '.buy_row', '.upload_list_widget', '.more_information_toggle', '.game_info_panel_widget',
        '.screenshot_list', '.video_embed', '.embed_wrapper', '.game_frame', '#game_drop', 'h1', 'h2', 'section']

def parse_sel(s):
    tag = re.match(r'^[a-z0-9]+', s); tag = tag.group(0) if tag else None
    ids = re.findall(r'#([\w-]+)', s); cls = re.findall(r'\.([\w-]+)', s)
    return tag, ids, cls

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.stack = []; s.active = False; s.wdepth = None; s.counts = {x: 0 for x in SELS}; s.found_w = False
        s.ps = {x: parse_sel(x) for x in SELS}; s.page_name = None
    def check(s, tag, attrs):
        a = dict(attrs); cl = set((a.get('class') or '').split()); i = a.get('id')
        if tag == 'body': s.page_name = a.get('data-page_name')
        if i == 'wrapper' and s.wdepth is None:
            s.wdepth = len(s.stack); s.found_w = True; s.active = True; return  # don't count wrapper itself
        if not s.active: return
        for x, (t, ids, cls) in s.ps.items():
            if t and t != tag: continue
            if ids and i not in ids: continue
            if not set(cls) <= cl: continue
            s.counts[x] += 1
    def handle_starttag(s, tag, attrs):
        s.check(tag, attrs)
        if tag not in VOID: s.stack.append(tag)
    def handle_startendtag(s, tag, attrs):
        s.check(tag, attrs)
    def handle_endtag(s, tag):
        if tag in VOID: return
        if tag in s.stack:
            while s.stack:
                t = s.stack.pop()
                if t == tag: break
        if s.active and len(s.stack) <= s.wdepth: s.active = False  # wrapper closed

def run(files):
    res = []
    for f in files:
        t = open(f, encoding='utf-8', errors='replace').read()
        if 'Too Many Requests' in t[:2000]: continue
        p = P(); p.feed(t)
        res.append((f, p.page_name, p.found_w, p.counts))
    return res

def main():
    groups = []
    for arg in sys.argv[1:]:
        g, pat = arg.split('=', 1)
        groups.append((g, sorted(glob.glob(pat))))
    data = {g: run(fs) for g, fs in groups}
    hdr = 'selector'.ljust(26) + ''.join(g[:14].rjust(16) for g, _ in groups)
    print(hdr)
    print(' ' * 26 + ''.join(('n=%d' % len(data[g])).rjust(16) for g, _ in groups))
    print(' ' * 26 + ''.join(('pn=' + ','.join(sorted({str(r[1]) for r in data[g]}))[:13]).rjust(16) for g, _ in groups))
    print(' ' * 26 + ''.join(('wrapper=%d' % sum(1 for r in data[g] if r[2])).rjust(16) for g, _ in groups))
    for x in SELS:
        row = x.ljust(26)
        for g, _ in groups:
            rs = data[g]; n = len(rs)
            pages = sum(1 for r in rs if r[3][x] > 0)
            med = statistics.median([r[3][x] for r in rs]) if rs else 0
            row += ('%d/%d m%g' % (pages, n, med)).rjust(16)
        print(row)

main()
