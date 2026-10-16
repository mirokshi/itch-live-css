"""Independent census of itch.io creator-profile HTML (verifier pass 2).
usage: python -I v2.py out.json file1.html file2.html ...
"""
import sys, re, json, os
from html.parser import HTMLParser
from collections import Counter

VOID = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
RAWTEXT = {"script","style"}

class N:
    def __init__(s, tag, attrs, parent):
        s.tag = tag; s.a = {k: (v if v is not None else "") for k, v in attrs}; s.kids = []; s.parent = parent; s.txt = []
    @property
    def cls(s): return s.a.get("class", "").split()
    @property
    def text(s): return "".join(s.txt)
    def iter(s):
        yield s
        for k in s.kids: yield from k.iter()
    def find(s, f):
        for x in s.iter():
            if f(x): return x
    def all(s, f): return [x for x in s.iter() if f(x)]
    def alltext(s): return "".join(x.text for x in s.iter())

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = N("#doc", [], None); s.cur = s.root
    def handle_starttag(s, t, at):
        n = N(t, at, s.cur); s.cur.kids.append(n)
        if t not in VOID: s.cur = n
    def handle_startendtag(s, t, at):
        s.cur.kids.append(N(t, at, s.cur))
    def handle_endtag(s, t):
        c = s.cur
        while c is not None and c.tag != t: c = c.parent
        if c is not None and c.parent is not None: s.cur = c.parent
    def handle_data(s, d): s.cur.txt.append(d)

def sig(n):
    s = n.tag
    if "id" in n.a: s += "#" + re.sub(r"\d+", "N", n.a["id"])
    return s + "".join("." + c for c in n.cls)

def has(c): return lambda x: c in x.cls

def raw_style(raw, sid):
    m = re.search(r'<style[^>]*id="%s"[^>]*>(.*?)</style>' % sid, raw, re.S)
    return m.group(1) if m else None

def page(path):
    rawb = open(path, "rb").read()
    raw = rawb.decode("utf-8", "replace")
    p = P(); p.feed(raw); d = p.root
    r = {"file": os.path.basename(path)}
    head = d.find(lambda x: x.tag == "head"); body = d.find(lambda x: x.tag == "body")
    if not head or not body: r["err"] = "nohead"; return r
    r["html_lang"] = (d.find(lambda x: x.tag == "html") or N("x", [], None)).a.get("lang")
    ho = []
    for c in head.kids:
        if c.tag == "link" and c.a.get("rel") == "stylesheet": ho.append("link:" + re.sub(r"\?.*", "", c.a["href"]).split("/")[2] + "/" + re.sub(r"\?.*", "", c.a["href"]).split("/")[-1])
        elif c.tag == "script": ho.append("script:" + (re.sub(r"\?.*", "", c.a.get("src", "")).split("/")[-1] if c.a.get("src") else ("data-src#" + c.a.get("id", "") if c.a.get("data-src") else "inline")))
        elif c.tag == "style": ho.append("style#" + c.a.get("id", ""))
    r["head_order"] = ho
    r["page_name"] = body.a.get("data-page_name")
    r["body_attrs_order"] = list(body.a.keys())
    r["body_class"] = body.a.get("class")
    r["body_children"] = [sig(c) for c in body.kids]
    w = body.find(lambda x: x.a.get("id") == "wrapper")
    r["wrapper"] = sig(w) if w else None
    r["wrapper_parent"] = sig(w.parent) if w else None
    if not w: return r
    r["wrapper_children"] = [sig(c) for c in w.kids]
    up = w.find(has("user_page"))
    r["user_page_classes"] = up.cls if up else None
    r["user_page_children"] = [sig(c) for c in up.kids]
    hdr = w.find(lambda x: x.a.get("id") == "profile_header")
    r["header"] = sig(hdr) if hdr else None
    if hdr:
        img = hdr.find(lambda x: x.tag == "img"); h1 = hdr.find(lambda x: x.tag == "h1")
        r["banner_attrs"] = sorted(img.a.keys()) if img else None
        r["banner_src"] = img.a.get("src") if img else None
        r["banner_wh"] = (img.a.get("width"), img.a.get("height")) if img else None
        r["banner_parent"] = sig(img.parent) if img else None
        r["h1_text_nonempty"] = bool(h1 and h1.alltext().strip())
        r["h1_parent"] = sig(h1.parent) if h1 else None
    pc = w.find(has("profile_content"))
    r["profile_content_children"] = [sig(c) for c in pc.kids] if pc else None
    r["has_columns"] = bool(w.find(has("columns")))
    ul = w.find(has("user_links"))
    if ul:
        r["user_links_sig"] = sig(ul)
        r["user_links_empty"] = (len(ul.kids) == 0 and ul.alltext().strip() == "")
        r["user_links_raw_empty"] = None
        lg = ul.all(has("link_group"))
        r["link_groups"] = len(lg)
        r["link_group_shapes"] = Counter(" + ".join(sig(k) for k in g.kids) for g in lg)
        r["link_a"] = Counter(str((" ".join(a.cls), a.a.get("rel"))) for a in ul.all(lambda x: x.tag == "a"))
        r["link_icon_classes"] = Counter(c for x in ul.all(lambda x: x.tag == "svg") for c in x.cls)
    bio = w.find(has("user_profile"))
    r["bio"] = sig(bio) if bio else None
    if bio:
        r["bio_classes"] = Counter(c for x in bio.iter() if x is not bio for c in x.cls)
        r["bio_tags"] = Counter(x.tag for x in bio.iter() if x is not bio)
        ext = []; internal = []
        for a in bio.all(lambda x: x.tag == "a" and x.a.get("href")):
            h = a.a["href"]
            if re.match(r"https?://([a-z0-9-]+\.)?itch\.io(/|$)", h): internal.append((a.a.get("rel"), a.a.get("referrerpolicy")))
            elif h.startswith("http"): ext.append((a.a.get("rel"), a.a.get("referrerpolicy")))
        r["bio_ext_links"] = Counter(map(str, ext)); r["bio_int_links"] = Counter(map(str, internal))
        r["bio_imgs"] = Counter(x.a.get("loading") for x in bio.all(lambda x: x.tag == "img"))
        r["bio_inline_style"] = len(bio.all(lambda x: x is not bio and "style" in x.a))
    cells = w.all(has("game_cell"))
    r["n_cells"] = len(cells)
    r["cell_class_sets"] = Counter(" ".join(c.cls) for c in cells)
    r["cell_attrs"] = Counter(",".join(sorted(c.a.keys())) for c in cells)
    thumbs = w.all(has("game_thumb"))
    r["thumbs"] = len(thumbs); r["thumb_inline_bg"] = sum(1 for t in thumbs if re.match(r"background-color:#[0-9a-fA-F]{3,8};?$", t.a.get("style", "")))
    imgs = [i for t in thumbs for i in t.all(lambda x: x.tag == "img")]
    r["thumb_img_attrs"] = Counter(",".join(sorted(i.a.keys())) for i in imgs)
    r["thumb_img_cls"] = Counter(" ".join(i.cls) for i in imgs)
    r["thumb_a"] = Counter(sig(a) + "[tabindex=%s]" % a.a.get("tabindex") for t in thumbs for a in t.kids if a.tag == "a")
    r["cell_data_children"] = Counter(" ".join(sig(k).replace("div.", "") for k in cd.kids) for c in cells for cd in c.kids if "game_cell_data" in cd.cls)
    r["game_title_children"] = Counter(" + ".join(sig(k) for k in gt.kids) for gt in w.all(has("game_title")))
    r["price_tags"] = Counter(sig(pt) + " > " + ",".join(sig(k) for k in pt.kids) for pt in w.all(has("price_tag")))
    r["price_tag_parent"] = Counter(sig(pt.parent) for pt in w.all(has("price_tag")))
    r["platform_kids"] = Counter(sig(k) for gp in w.all(has("game_platform")) for k in gp.kids)
    r["is_owner_where"] = Counter(("user_game_grid" if c.parent and "user_game_grid" in c.parent.cls else sig(c.parent)) for c in cells if "is_owner" in c.cls)
    r["author_in_own_grid"] = sum(1 for c in cells if c.parent and "user_game_grid" in c.parent.cls and c.find(has("game_author")))
    r["own_grid_cells"] = sum(1 for c in cells if c.parent and "user_game_grid" in c.parent.cls)
    r["grids"] = Counter(sig(g) + " <- " + sig(g.parent) for g in w.all(has("game_grid_widget")))
    r["sections"] = [sig(s) + " <- " + sig(s.parent) for s in w.all(lambda x: x.tag == "section")]
    r["collection_rows"] = [ " ".join(sorted(cr.a.keys())) + " :: " + " ".join(sig(k) for k in (cr.kids[0].kids if cr.kids else [])) for cr in w.all(has("collection_row"))]
    pg = w.find(has("purchased_games"))
    r["purchased_h2"] = (pg.find(lambda x: x.tag == "h2").alltext().strip()[:40] if pg and pg.find(lambda x: x.tag == "h2") else None)
    ft = w.find(has("footer"))
    r["footer_parent"] = sig(ft.parent) if ft else None
    r["footer_shape"] = (" ".join(sig(k) for k in ft.kids) + " :: " + " ".join(sig(k) for k in ft.kids[0].kids)) if ft and ft.kids else None
    r["footer_links"] = [(a.a.get("href"), a.alltext().strip()) for a in ft.all(lambda x: x.tag == "a")] if ft else None
    r["ids_in_wrapper"] = Counter(re.sub(r"\d+", "N", x.a["id"]) for x in w.iter() if "id" in x.a)
    r["raw_ids"] = [x.a["id"] for x in w.iter() if "id" in x.a][:6]
    r["inner_column_parents"] = Counter(sig(x.parent) for x in w.all(has("inner_column")))
    ut = raw_style(raw, "user_theme"); cc = raw_style(raw, "custom_css")
    r["user_theme"] = ut
    r["custom_css"] = cc
    if cc is not None:
        m = re.search(rb'<style[^>]*id="custom_css"[^>]*>(.*?)</style>', rawb, re.S)
        r["custom_css_bytes"] = len(m.group(1)); r["custom_css_cr"] = m.group(1).count(b"\r")
    bm = re.search(rb'class="user_profile formatted"[^>]*>(.*?)<div class="column game_column|class="user_profile formatted"[^>]*>(.*?)</div>\s*</div>', rawb, re.S)
    r["bio_cr"] = (rawb.count(b"\r"))
    tools = body.find(lambda x: x.a.get("id") == "user_tools")
    r["user_tools"] = (sig(tools) + " :: " + " ".join(sig(k) for k in tools.kids) + " :: " + " ".join(a.a.get("href", "")[:60] for a in tools.all(lambda x: x.tag == "a"))) if tools else None
    r["user_tools_before_wrapper"] = (body.kids.index(tools) < body.kids.index(w)) if tools and w in body.kids else None
    r["lazy_imgs_with_src"] = sum(1 for i in imgs if "src" in i.a)
    r["lazy_src_sample"] = [re.sub(r"img\.itch\.zone/[^/]+/", "img.itch.zone/X/", i.a.get("data-lazy_src", ""))[:80] for i in imgs[:2]]
    return r

if __name__ == "__main__":
    out = sys.argv[1]; res = [page(f) for f in sys.argv[2:]]
    json.dump(res, open(out, "w", encoding="utf-8"), indent=1, default=lambda o: dict(o) if isinstance(o, Counter) else str(o), ensure_ascii=False)
    print(len(res), "pages")
