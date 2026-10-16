"""Analyze itch.io profile HTML files (logged-out curl captures).
usage: python -I analyze.py <rawdir> <glob-prefix> <out.json>
Writes per-page summary + aggregate class/id frequencies inside #wrapper.
"""
import sys, os, re, json, glob
from html.parser import HTMLParser
from collections import Counter, defaultdict

VOID = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}

class Node:
    __slots__=("tag","attrs","children","parent","text")
    def __init__(s,tag,attrs,parent):
        s.tag=tag; s.attrs=dict(attrs); s.children=[]; s.parent=parent; s.text=""

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.root=Node("#root",[],None); s.cur=s.root
    def handle_starttag(s,tag,attrs):
        n=Node(tag,attrs,s.cur); s.cur.children.append(n)
        if tag not in VOID: s.cur=n
    def handle_startendtag(s,tag,attrs):
        n=Node(tag,attrs,s.cur); s.cur.children.append(n)
    def handle_endtag(s,tag):
        c=s.cur
        while c is not None and c.tag!=tag: c=c.parent
        if c is not None and c.parent is not None: s.cur=c.parent
    def handle_data(s,d):
        s.cur.text+=d

def walk(n):
    yield n
    for c in n.children: yield from walk(c)

def find(n,pred):
    for x in walk(n):
        if pred(x): return x
def findall(n,pred): return [x for x in walk(n) if pred(x)]
def cls(n): return (n.attrs.get("class") or "").split()
def sig(n):
    s=n.tag
    i=n.attrs.get("id")
    if i: s+="#"+re.sub(r"\d+","N",i)
    for c in cls(n): s+="."+c
    return s

def skeleton(n,depth=0,maxdepth=12,out=None,seen=None):
    """classes/ids only, collapse repeated sibling signatures"""
    if out is None: out=[]
    prev=None; rep=0
    kids=[c for c in n.children if c.tag not in ("path","polyline","circle","line","rect","g")]
    lines=[]
    for c in kids:
        sg=sig(c)
        if sg==prev:
            rep+=1; continue
        if rep: lines.append(("  "*(depth)+f"  (x{rep+1})",None))
        prev=sg; rep=0
        lines.append(("  "*depth+sg,c))
    if rep: lines.append(("  "*(depth)+f"  (x{rep+1})",None))
    for txt,c in lines:
        out.append(txt)
        if c is not None and depth<maxdepth and c.tag not in ("svg","script","style"):
            skeleton(c,depth+1,maxdepth,out)
    return out

def analyze(path):
    raw=open(path,encoding="utf-8",errors="replace").read()
    p=P(); p.feed(raw)
    r={"file":os.path.basename(path),"bytes":len(raw.encode("utf-8"))}
    head=find(p.root,lambda x:x.tag=="head")
    body=find(p.root,lambda x:x.tag=="body")
    if head is None or body is None:
        r["error"]="no head/body"; return r,None
    order=[]
    for c in head.children:
        if c.tag=="link":
            href=c.attrs.get("href","")
            order.append("link:"+re.sub(r"\?.*","",href).replace("https://",""))
        elif c.tag=="script":
            if c.attrs.get("src"): order.append("script:"+re.sub(r"\?.*","",c.attrs["src"]).replace("https://",""))
            elif c.attrs.get("data-src"): order.append("script[data-src]#"+c.attrs.get("id",""))
            else: order.append("script:inline:"+re.sub(r"\s+"," ",c.text.strip())[:40])
        elif c.tag=="style":
            order.append("style#"+c.attrs.get("id","?"))
    r["head_order"]=order
    ut=find(head,lambda x:x.tag=="style" and x.attrs.get("id")=="user_theme")
    cc=find(head,lambda x:x.tag=="style" and x.attrs.get("id")=="custom_css")
    r["user_theme"]=ut.text if ut is not None else None
    r["custom_css_len"]=len(cc.text) if cc is not None else None
    if cc is not None:
        t=cc.text
        r["custom_css_imports"]=re.findall(r"@import\s+(?:url\()?\s*['\"]?([^'\")\s;]+)",t)
        r["custom_css_has_wrapper"]="#wrapper" in t
        r["custom_css_selectors_sample"]=sorted(set(re.findall(r"[#.][A-Za-z_][\w-]*",re.sub(r"\{[^{}]*\}","{}",re.sub(r"/\*.*?\*/","",t,flags=re.S)))))[:200]
        r["custom_css_text"]=t
    r["body_class"]=body.attrs.get("class")
    r["body_data"]={k:v for k,v in body.attrs.items() if k.startswith("data-")}
    r["body_children"]=[sig(c) for c in body.children]
    w=find(body,lambda x:x.attrs.get("id")=="wrapper")
    r["wrapper_sig"]=sig(w) if w else None
    if w is None: return r,p
    up=find(w,lambda x:"user_page" in cls(x))
    r["user_page_sig"]=sig(up) if up else None
    hdr=find(w,lambda x:x.attrs.get("id")=="profile_header")
    if hdr is not None:
        r["header_sig"]=sig(hdr)
        img=find(hdr,lambda x:x.tag=="img")
        r["banner_img_src"]=bool(img is not None and img.attrs.get("src"))
        r["banner_img_attrs"]=sorted(img.attrs.keys()) if img is not None else None
        h1=find(hdr,lambda x:x.tag=="h1")
        r["header_h1_present"]=h1 is not None
        r["header_skel"]=skeleton(hdr)
    ul=find(w,lambda x:"user_links" in cls(x))
    r["user_links"]=None
    if ul is not None:
        groups=findall(ul,lambda x:"link_group" in cls(x))
        icons=[ [c for c in cls(s) if c.startswith("icon_")] for s in findall(ul,lambda x:x.tag=="svg")]
        r["user_links"]={"groups":len(groups),"icons":sorted(set(sum(icons,[]))),
                         "a_classes":sorted(set(" ".join(cls(a)) for a in findall(ul,lambda x:x.tag=="a")))}
    bio=find(w,lambda x:"user_profile" in cls(x))
    r["bio_sig"]=sig(bio) if bio is not None else None
    if bio is not None:
        r["bio_tags"]=dict(Counter(x.tag for x in walk(bio) if x is not bio))
        r["bio_classes"]=dict(Counter(c for x in walk(bio) if x is not bio for c in cls(x)))
        r["bio_attrs"]=dict(Counter(a for x in walk(bio) if x is not bio for a in x.attrs))
        r["bio_styles"]=[x.attrs["style"] for x in walk(bio) if x is not bio and "style" in x.attrs][:10]
    gc=find(w,lambda x:"game_column" in cls(x))
    r["game_column"]= skeleton(gc,maxdepth=3) if gc is not None else None
    r["grids"]=[sig(g) for g in findall(w,lambda x:"game_grid_widget" in cls(x))]
    r["n_game_cells"]=len(findall(w,lambda x:"game_cell" in cls(x)))
    r["cell_classes"]=dict(Counter(" ".join(cls(x)) for x in findall(w,lambda x:"game_cell" in cls(x))))
    r["sections"]=[sig(s) for s in findall(w,lambda x:x.tag=="section")]
    r["collection_rows"]=len(findall(w,lambda x:"collection_row" in cls(x)))
    ft=find(w,lambda x:"footer" in cls(x))
    r["footer_skel"]=skeleton(ft) if ft is not None else None
    r["footer_links"]=[a.attrs.get("href") for a in findall(ft,lambda x:x.tag=="a")] if ft is not None else None
    r["wrapper_children"]=[sig(c) for c in w.children]
    r["user_page_children"]=[sig(c) for c in up.children] if up is not None else None
    r["skeleton"]=skeleton(w,maxdepth=14)
    ids=Counter(); classes=Counter()
    for x in walk(w):
        if x.attrs.get("id"): ids[re.sub(r"\d+","N",x.attrs["id"])]+=1
        for c in cls(x): classes[c]+=1
    r["ids"]=dict(ids); r["classes"]=dict(classes)
    r["inline_styles_in_wrapper"]=dict(Counter(re.sub(r"#[0-9a-fA-F]{3,8}","#HEX",x.attrs["style"]) for x in walk(w) if "style" in x.attrs))
    return r,p

if __name__=="__main__":
    rawdir,prefix,out=sys.argv[1:4]
    res=[]
    for f in sorted(glob.glob(os.path.join(rawdir,prefix+"*.html"))):
        r,_=analyze(f); res.append(r)
    json.dump(res,open(out,"w",encoding="utf-8"),indent=1,ensure_ascii=False)
    print(len(res),"pages")
