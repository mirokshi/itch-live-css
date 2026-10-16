"""Verifier census over saved profile HTML. usage: python -I census.py <rawdir> <prefix> [<rawdir> <prefix> ...]"""
import sys, os, re, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tree import parse, Node

C = collections.Counter
T = collections.defaultdict(C)
pages = []
args = sys.argv[1:]
files = []
for i in range(0, len(args), 2):
    d, pre = args[i], args[i + 1]
    for f in sorted(os.listdir(d)):
        if f.startswith(pre) and f.endswith(".html"):
            files.append(os.path.join(d, f))

def hascls(c):
    return lambda n: c in n.classes

per = {}
for path in files:
    name = os.path.basename(path)[:-5]
    root, html = parse(path)
    raw = open(path, "rb").read()
    body = root.first(lambda n: n.tag == "body")
    if body is None:
        T["nobody"][name] += 1
        continue
    pn = body.attrs.get("data-page_name")
    T["page_name"][pn] += 1
    wrapper = root.first(lambda n: n.id == "wrapper")
    if pn != "user" or wrapper is None:
        T["nonuser"][f"{name}:{pn}:{'wrapper' if wrapper else 'nowrapper'}"] += 1
        # community-on-subdomain checks
        T["nonuser_has_user_theme"][bool(root.first(lambda n: n.id == 'user_theme'))] += 1
        T["nonuser_has_custom_css"][bool(root.first(lambda n: n.id == 'custom_css'))] += 1
        rob = root.first(lambda n: n.tag == 'meta' and n.attrs.get('name') == 'robots')
        T["nonuser_robots"][rob.attrs.get('content') if rob else None] += 1
        T["nonuser_css"][tuple(sorted(set(re.findall(r'static\.itch\.io/([a-z_.]+\.(?:css|js))', html))))] += 1
        continue
    p = {}
    per[name] = p
    T["body_classes_set"][" ".join(sorted(body.classes))] += 1
    T["body_classes_order"][" ".join(body.classes)] += 1
    T["body_attr_order"][",".join(body.attr_order)] += 1
    T["body_children"][" | ".join(c.sig().replace(re.sub(r'\D', '', c.id or '') or 'xx', 'N') if c.id else c.sig() for c in body.elems())] += 1
    T["wrapper_classes"][" ".join(wrapper.classes)] += 1
    T["wrapper_parent"][wrapper.parent.tag] += 1
    wch = [re.sub(r"\d+", "N", c.sig()) for c in wrapper.elems()]
    T["wrapper_children"][" | ".join(re.sub(r"\.mode_\w+|\.has_banner", "", s) for s in wch)] += 1
    ids = C()
    for n in wrapper.iter():
        if n.id:
            ids[re.sub(r"\d+", "N", n.id)] += 1
    for k in ids:
        T["ids_in_wrapper"][k] += 1
    up = wrapper.first(hascls("user_page"))
    mods = [c for c in up.classes if c not in ("user_page", "page_widget", "base_widget")]
    p["mods"] = mods
    for m in mods:
        T["user_page_mods"][m] += 1
    T["user_page_base"][" ".join(c for c in up.classes if c in ("user_page", "page_widget", "base_widget"))] += 1
    # header
    ph = up.first(lambda n: n.id == "profile_header")
    T["profile_header"][ph.sig() if ph else None] += 1
    T["profile_header_children"][" | ".join(c.sig() for c in ph.elems())] += 1
    img = ph.first(hascls("profile_banner"))
    T["banner_img_attrs"][(",".join(sorted(img.attrs)), "has_banner" in mods)] += 1
    if "src" in img.attrs:
        T["banner_src_host"][re.sub(r"(https://[^/]+/)[^/]+/(\w+)/.*", r"\1…/\2/…", img.attrs["src"])] += 1
        if img.attrs.get("width"):
            p["banner_wh"] = (int(img.attrs["width"]), int(img.attrs.get("height", 0)))
    th = ph.first(hascls("text_header"))
    h1 = th.first(lambda n: n.tag == "h1") if th else None
    T["h1_nonempty"][(bool(h1 and h1.alltext().strip()), "has_banner" in mods)] += 1
    T["text_header_sig"][th.sig() if th else None] += 1
    # profile_content
    pc = up.first(hascls("profile_content"))
    T["profile_content_children"][" | ".join(re.sub(r"\d+", "N", c.sig()) for c in pc.elems())] += 1
    cols = pc.first(hascls("columns"))
    p["cols"] = bool(cols)
    if cols:
        T["columns_children"][" | ".join(c.sig() for c in cols.elems())] += 1
        pcol = cols.first(hascls("profile_column"))
        gcol = cols.first(hascls("game_column"))
        T["profile_column_children"][" | ".join(re.sub(r"\d+", "N", c.sig()) for c in pcol.elems())] += 1
        T["game_column_children"][" | ".join(c.sig() for c in gcol.elems()) if gcol else None] += 1
    # user_links
    ul = up.first(hascls("user_links"))
    T["user_links_sig"][re.sub(r"\d+", "N", ul.sig()) if ul else None] += 1
    if ul:
        empty = not ul.children or all(isinstance(c, str) and c == "" for c in ul.children)
        ws_only = all(isinstance(c, str) and not c.strip() for c in ul.children)
        T["user_links_empty_strict"][empty] += 1
        T["user_links_ws_only"][ws_only] += 1
        for lg in ul.elems():
            T["user_links_child"][lg.sig()] += 1
            kids = lg.elems()
            T["link_group_kids"][" + ".join(k.sig() for k in kids)] += 1
            a = lg.first(lambda n: n.tag == "a")
            if a:
                T["link_a"][(a.attrs.get("class"), a.attrs.get("rel"), kids[0].sig() if kids else None)] += 1
    # bio
    bio = up.first(lambda n: "user_profile" in n.classes)
    p["bio"] = bool(bio)
    T["bio_sig"][bio.sig() if bio else None] += 1
    if bio:
        for n in bio.iter():
            if n is bio:
                continue
            T["bio_tags"][n.tag] += 1
            for c in n.classes:
                T["bio_classes"]["custom-*" if c.startswith("custom-") else c] += 1
            if n.tag == "a":
                href = n.attrs.get("href", "")
                internal = bool(re.match(r"https?://([a-z0-9-]+\.)?itch\.io(/|$)", href))
                T["bio_a_rel"][(("itch" if internal else "ext"), n.attrs.get("rel"), n.attrs.get("referrerpolicy"))] += 1
            if n.tag == "img":
                T["bio_img_loading"][n.attrs.get("loading")] += 1
            if "style" in n.attrs:
                T["bio_inline_style_pages"][name] = 1
        T["bio_cr"][b"\r" in raw[raw.find(b'user_profile'):raw.find(b'user_profile') + 20000][:0] or None] += 0
    # footer
    ft = wrapper.first(hascls("footer"))
    T["footer_parent"][ft.parent.sig() if ft else None] += 1
    if ft:
        fi = ft.first(hascls("footer_inner"))
        T["footer_inner_links"][tuple((a.attrs.get("href", "")[:18], a.alltext().strip()[:20]) for a in fi.find_all(lambda n: n.tag == "a"))[:2].__len__()] += 1
        T["footer_text"][re.sub(r"\s+", " ", fi.alltext()).strip()[:60]] += 1
    # sections
    secs = [c.sig() for c in up.elems() if c.tag == "section"]
    T["sections"][" ".join(secs)] += 1
    T["user_page_children"][" | ".join(re.sub(r"\d+", "N", c.sig()) for c in up.elems())] += 1
    for s in up.elems():
        if s.tag != "section":
            continue
        for ch in s.elems():
            T["section_child:" + s.sig()][re.sub(r"\d+", "N", ch.sig())] += 1
            ic = ch.first(hascls("inner_column"))
            if ic:
                T["section_inner:" + s.sig()][" + ".join(re.sub(r"\d+", "N", k.sig()) for k in ic.elems())] += 1
            if "collection_row" in ch.classes:
                T["collection_row_attrs"][",".join(sorted(ch.attrs))] += 1
    # grids
    for g in up.find_all(hascls("game_grid_widget")):
        T["grid_sig"][(g.sig(), g.parent.sig())] += 1
    # inner_column ids
    for n in root.iter():
        if n.id == "inner_column":
            T["inner_column_id"][name] += 1
        if "inner_column" in n.classes and wrapper in []:
            pass
    for n in wrapper.find_all(hascls("inner_column")):
        T["inner_column_parent"][n.parent.sig() if "collection_row" not in n.parent.classes else "div.collection_row"] += 1
    # cells
    for cell in up.find_all(hascls("game_cell")):
        T["cell_classes"][" ".join(cell.classes)] += 1
        T["cell_attrs"][",".join(sorted(cell.attrs))] += 1
        thumb = cell.first(hascls("game_thumb"))
        if thumb:
            st = thumb.attrs.get("style")
            T["thumb_style"][re.sub(r"#[0-9a-fA-F]{3,8}", "#hex", st) if st else None] += 1
            T["thumb_kids"][" + ".join(k.sig() for k in thumb.elems())] += 1
            a = thumb.first(lambda n: n.tag == "a")
            if a:
                T["thumb_a_kids"][" + ".join(k.sig() for k in a.elems())] += 1
                T["thumb_a_attrs"][",".join(sorted(a.attrs))] += 1
            im = thumb.first(lambda n: n.tag == "img")
            if im:
                T["thumb_img_attrs"][(",".join(sorted(im.attrs)), im.attrs.get("width"), im.attrs.get("height"))] += 1
        data = cell.first(hascls("game_cell_data"))
        if data:
            T["data_kids"][" + ".join(k.sig() for k in data.elems())] += 1
            gt = data.first(hascls("game_title"))
            if gt:
                T["title_kids"][" + ".join(k.sig() for k in gt.elems())] += 1
                for pt in gt.find_all(hascls("price_tag")):
                    T["price_tag"][(pt.sig(), " + ".join(k.sig() for k in pt.elems()))] += 1
            for pl in data.find_all(hascls("game_platform")):
                for k in pl.elems():
                    T["platform_kids"][k.sig()] += 1
        in_own = any("user_game_grid" in a.classes for a in [cell.parent])
        T["author_in_own_grid"][(in_own, bool(cell.first(hascls("game_author"))))] += 1
        if "is_owner" in cell.classes:
            T["is_owner_parent"]["own" if in_own else "carousel"] += 1
    for pr in up.find_all(hascls("price_tag")):
        T["price_tag_parent"][pr.parent.sig()] += 1
    # user_tools
    ut = root.first(lambda n: n.id == "user_tools")
    T["user_tools"][(ut.sig() if ut else None, ut.parent.tag if ut else None)] += 1
    if ut:
        T["user_tools_a"][tuple((a.attrs.get("class"), a.attrs.get("href")) for a in ut.find_all(lambda n: n.tag == "a"))[0][1] if ut.find_all(lambda n: n.tag == "a") else None] += 1
    # head order
    head = root.first(lambda n: n.tag == "head")
    seq = []
    for n in head.elems():
        if n.tag == "link" and "stylesheet" in (n.attrs.get("rel") or ""):
            h = n.attrs.get("href", "")
            seq.append("link:" + ("user.css" if "user.css" in h else "gfont" if "fonts.googleapis" in h else h[:40]))
        elif n.tag == "style":
            seq.append("style#" + str(n.id))
        elif n.tag == "script":
            s = n.attrs.get("src") or n.attrs.get("data-src")
            if s:
                seq.append("script:" + re.sub(r"\?\d+", "", s.split("/")[-1]) + ("(data-src)" if "data-src" in n.attrs else ""))
            else:
                txt = n.alltext()
                seq.append("inline:" + ("translations" if "translations" in txt else "current_user" if "current_user" in txt else "gtag" if "gtag" in txt else txt.strip()[:20]))
    p["head"] = seq
    T["head_seq"][" > ".join(seq)] += 1
    # after custom_css anything?
    if "style#custom_css" in seq:
        T["after_custom_css"][tuple(seq[seq.index("style#custom_css") + 1:])] += 1
    # custom css raw
    m = re.search(rb'<style id="custom_css" type="text/css">(.*?)</style>', raw, re.S)
    if m:
        css = m.group(1)
        p["css_len_bytes"] = len(css)
        p["css_len_chars"] = len(css.decode("utf-8"))
        p["css_cr"] = css.count(b"\r")
        p["css_nl"] = css.count(b"\n")
        p["css_ascii"] = all(b < 128 for b in css)
        p["css_import_at0"] = css.lstrip()[:7] == b"@import"
        p["css_import_hosts"] = sorted(set(re.findall(rb"@import\s+url\(['\"]?https?://([^/'\")]+)", css) + re.findall(rb"@import\s+['\"]https?://([^/'\"]+)", css)))
    um = re.search(rb'<style id="user_theme" type="text/css">(.*?)</style>', raw, re.S)
    if um:
        p["theme"] = um.group(1).decode("utf-8")
    # body bio CR
    bm = re.search(rb'class="user_profile formatted">(.*?)</div>\s*</div>', raw, re.S)
    if bm:
        p["bio_cr"] = bm.group(1).count(b"\r")

out = {k: dict(v.most_common()) for k, v in T.items()}
out = {k: {str(kk): vv for kk, vv in v.items()} for k, v in out.items()}
json.dump({"tallies": out, "pages": per}, open(os.environ.get("CENSUS_OUT", "census.json"), "w", encoding="utf-8"), indent=1, default=str)
for k, v in out.items():
    if k in ("bio_inline_style_pages",):
        print(k, len(v)); continue
    items = list(v.items())
    print(f"== {k} ({len(items)} distinct)")
    for kk, vv in items[:14]:
        print(f"   {vv:5}  {kk[:230]}")
print("pages analysed:", len(per))
