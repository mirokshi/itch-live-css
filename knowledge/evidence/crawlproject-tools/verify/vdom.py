"""Verifier's independent mini-DOM (stdlib only). Usage: python -I vdom.py <file.html> ... -> JSON per page on stdout."""
import sys, json, hashlib, re
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class N:
    __slots__ = ('tag','attrs','children','parent','text')
    def __init__(s, tag, attrs, parent):
        s.tag = tag; s.attrs = dict(attrs); s.children = []; s.parent = parent; s.text = []
    @property
    def id(s): return s.attrs.get('id') or ''
    @property
    def cls(s): return (s.attrs.get('class') or '').split()
    def sig(s):
        out = s.tag
        if s.id: out += '#' + (re.sub(r'\d+', 'N', s.id))
        if s.cls: out += '.' + '.'.join(s.cls)
        return out
    def walk(s):
        yield s
        for c in s.children:
            yield from c.walk()
    def find(s, pred):
        return [n for n in s.walk() if pred(n)]
    def one(s, pred):
        r = s.find(pred); return r[0] if r else None
    def ancestors(s):
        p = s.parent
        while p is not None:
            yield p; p = p.parent
    def raw_text(s):
        return ''.join(s.text)

class B(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.root = N('#root', [], None); s.stack = [s.root]
    def handle_starttag(s, tag, attrs):
        n = N(tag, attrs, s.stack[-1]); s.stack[-1].children.append(n)
        if tag not in VOID: s.stack.append(n)
    def handle_startendtag(s, tag, attrs):
        n = N(tag, attrs, s.stack[-1]); s.stack[-1].children.append(n)
    def handle_endtag(s, tag):
        for i in range(len(s.stack) - 1, 0, -1):
            if s.stack[i].tag == tag:
                del s.stack[i:]; return
    def handle_data(s, d):
        s.stack[-1].text.append(d)

def parse(path):
    b = B(); b.feed(open(path, encoding='utf-8', errors='replace').read()); return b.root

def has(c): return lambda n: c in n.cls
def byid(i): return lambda n: n.id == i

def kids(n): return [c.sig() for c in n.children] if n else None

def analyze(path):
    r = parse(path); o = {'file': path.split('/')[-1].split('\\')[-1]}
    body = r.one(lambda n: n.tag == 'body'); head = r.one(lambda n: n.tag == 'head')
    if body is None: o['error'] = 'nobody'; return o
    o['body_class'] = body.cls; o['page_name'] = body.attrs.get('data-page_name')
    o['body_children'] = kids(body)
    hs = []
    for c in (head.children if head else []):
        if c.tag == 'link': hs.append('link:' + re.sub(r'\?.*', '', c.attrs.get('href', ''))[:60])
        elif c.tag == 'style': hs.append('style#' + c.id)
        elif c.tag == 'script': hs.append('script')
        else: hs.append(c.tag)
    o['head'] = hs
    w = r.one(byid('wrapper')); o['wrapper'] = w.sig() if w else None
    o['wrapper_children'] = kids(w)
    ic = r.one(byid('inner_column')); o['inner_column'] = ic.sig() if ic else None
    o['inner_children'] = kids(ic)
    h = r.one(byid('header')); o['header'] = h.sig() if h else None; o['header_children'] = kids(h)
    if h:
        img = h.one(lambda n: n.tag == 'img'); o['header_img_alt'] = img.attrs.get('alt') if img else None
        o['header_img_parent'] = img.parent.tag if img else None
    pw = r.one(lambda n: 'page_widget' in n.cls); o['page_widget'] = pw.sig() if pw else None
    o['page_widget_children'] = kids(pw)
    cols = r.one(has('columns')); o['columns_children'] = kids(cols)
    lc = r.one(has('left_col')); o['left_children'] = kids(lc)
    rc = r.one(has('right_col')); o['right_children'] = kids(rc)
    o['formatted_description_parents'] = [n.parent.sig() for n in r.find(has('formatted_description'))]
    o['user_formatted_parents'] = [n.parent.sig() + ' > ' + n.sig() for n in r.find(has('user_formatted'))][:12]
    gf = r.find(has('game_frame'))
    o['game_frames'] = [{'sig': g.sig(), 'style': g.attrs.get('style'), 'dw': g.attrs.get('data-width'), 'dh': g.attrs.get('data-height'), 'children': kids(g)} for g in gf]
    o['iframes'] = [{k: v for k, v in f.attrs.items() if k != 'title'} | {'parent': f.parent.sig()} for f in r.find(lambda n: n.tag == 'iframe')]
    o['placeholders'] = [{'has_data_iframe': 'data-iframe' in p.attrs, 'di': (p.attrs.get('data-iframe') or '')[:300], 'children': kids(p)} for p in r.find(has('iframe_placeholder'))]
    shots = r.find(has('screenshot'))
    o['screenshot_imgs'] = [sorted(s.attrs.keys()) for s in shots if s.tag == 'img'][:3]
    o['n_screenshot_imgs'] = len([s for s in shots if s.tag == 'img'])
    o['n_screenshot_with_alt'] = len([s for s in shots if s.tag == 'img' and 'alt' in s.attrs])
    o['ids'] = sorted({re.sub(r'\d+', 'N', n.id) for n in r.walk() if n.id})
    cc = r.one(byid('custom_css')); gt = r.one(byid('game_theme'))
    o['custom_css_len'] = len(cc.raw_text()) if cc else None
    o['custom_css_md5'] = hashlib.md5(cc.raw_text().encode()).hexdigest() if cc else None
    o['game_theme_md5'] = hashlib.md5(gt.raw_text().encode()).hexdigest() if gt else None
    o['game_theme_len'] = len(gt.raw_text()) if gt else None
    o['custom_css_last_in_head'] = bool(head and head.children and head.children[-1].id == 'custom_css')
    # buy row / uploads / misc
    o['n_buy_row'] = len(r.find(has('buy_row')))
    o['buy_rows'] = [{'parent': b.parent.sig(), 'kids': kids(b), 'msg': kids(b.one(has('buy_message')))} for b in r.find(has('buy_row'))]
    up = r.find(has('upload'))
    o['uploads'] = [{'kids': kids(u), 'info': kids(u.one(has('info_column'))), 'name': kids(u.one(has('upload_name')))} for u in up[:2]]
    mit = r.one(has('more_information_toggle'))
    o['more_info'] = kids(mit)
    if mit:
        o['more_info_tree'] = [n.sig() for n in mit.walk()][:14]
        o['info_labels'] = [tr.children[0].raw_text().strip() for tr in mit.find(lambda n: n.tag == 'tr') if tr.children]
    o['comments_widget'] = len(r.find(has('game_comments_widget')))
    o['community_summary'] = len(r.find(has('community_summary')))
    cp = r.one(has('community_post'))
    o['community_post_tree'] = [n.sig() for n in cp.walk()][:20] if cp else None
    gcw = r.one(has('game_comments_widget')); o['comments_widget_children'] = kids(gcw)
    o['video_embed'] = [{'sig': v.sig(), 'parent': v.parent.sig(), 'kids': kids(v)} for v in r.find(has('video_embed'))]
    o['donate'] = [{'parent': d.parent.sig(), 'kids': kids(d)} for d in r.find(has('donate'))]
    o['header_buy_row'] = [{'parent': d.parent.sig(), 'kids': kids(d)} for d in r.find(has('header_buy_row'))]
    o['rewards'] = kids(r.one(has('rewards')))
    rr = r.one(has('reward_row')); o['reward_row'] = kids(rr)
    o['download_instructions'] = kids(r.one(has('download_instructions')))
    o['app_store_links'] = kids(r.one(has('app_store_links')))
    asl = r.one(has('app_store_links'))
    o['app_store_prev'] = None
    if asl:
        sib = asl.parent.children; i = sib.index(asl); o['app_store_prev'] = sib[i-1].sig() if i else None
    o['bundle_row'] = [n.sig() for n in r.one(has('bundle_row')).walk()][:10] if r.one(has('bundle_row')) else None
    ut = r.one(byid('user_tools')); o['user_tools'] = ut.sig() if ut else None
    o['user_tools_parent'] = ut.parent.tag if ut else None
    o['user_tools_li'] = [c.sig() for c in ut.children] if ut else None
    # devlog bits
    for k in ('game_devlog_post_page', 'game_devlog_page', 'game_comments_page', 'split_columns', 'primary_column', 'game_metadata', 'blog_post_list_widget', 'devlog'):
        n = r.one(has(k)); o['k_' + k] = kids(n)
    li = r.one(lambda n: n.tag == 'li' and n.parent is not None and 'blog_post_list_widget' in n.parent.cls)
    o['blog_li_tree'] = [n.sig() for n in li.walk()][:20] if li else None
    ph = r.one(lambda n: n.tag == 'section' and 'post_header' in n.cls); o['post_header'] = kids(ph)
    return o

if __name__ == '__main__':
    out = [analyze(p) for p in sys.argv[1:]]
    json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
