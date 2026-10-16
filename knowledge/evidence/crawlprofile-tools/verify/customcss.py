"""Stats on style#custom_css blocks. usage: python -I customcss.py <dir> <prefix> [...]"""
import sys, os, re
args = sys.argv[1:]
rows = []
for i in range(0, len(args), 2):
    d, pre = args[i], args[i + 1]
    for f in sorted(os.listdir(d)):
        if not (f.startswith(pre) and f.endswith(".html")):
            continue
        raw = open(os.path.join(d, f), "rb").read()
        m = re.search(rb'<style id="custom_css" type="text/css">(.*?)</style>', raw, re.S)
        if not m:
            continue
        css = m.group(1)
        txt = css.decode("utf-8")
        # bio CR
        bio = re.search(rb'class="user_profile formatted">(.*?)<div class="column game_column">', raw, re.S) or re.search(rb'class="user_profile formatted">(.*?)</section>|class="user_profile formatted">(.*)', raw, re.S)
        bio_cr = bio.group(0).count(b"\r") if bio else None
        nocom = re.sub(r"/\*.*?\*/", "", txt, flags=re.S)
        # selectors: top-level preludes (skip at-rules), crude
        sels = []
        depth = 0; buf = ""; stack = []
        for ch in nocom:
            if ch == "{":
                stack.append(buf.strip()); buf = ""
            elif ch == "}":
                if stack: stack.pop()
                buf = ""
            elif ch == ";" and not stack:
                buf = ""
            else:
                buf += ch
            if ch == "{" and stack and not stack[-1].startswith("@") and not any(s.startswith("@keyframes") or s.startswith("@-webkit-keyframes") or s.startswith("@font-face") for s in stack[:-1]):
                for s in stack[-1].split(","):
                    sels.append(s.strip())
        unscoped = [s for s in sels if s and "#wrapper" not in s and not re.match(r"^(from|to|\d+%)$", s)]
        rows.append(dict(
            page=f[:-5], chars=len(txt), bytes=len(css), ascii=all(b < 128 for b in css), cr=css.count(b"\r"), nl=css.count(b"\n"),
            comments=len(re.findall(r"/\*.*?\*/", txt, flags=re.S)), bio_cr=bio_cr,
            import_at0=txt.lstrip().startswith("@import"), imports=re.findall(r"@import\s+(?:url\()?['\"]?(https?://[^/'\")]+)", txt),
            n_sel=len(sels), n_unscoped=len(unscoped), unscoped_sample=sorted(set(unscoped))[:12],
            has_html=bool(re.search(r"<!DOCTYPE|<html|<head|</head|<body", txt, re.I)), has_style_open="<style" in txt,
            has_style_close="</style" in txt, important="!important" in txt, keyframes="@keyframes" in txt, media="@media" in txt,
            fontface="@font-face" in txt, itchvar="var(--itchio" in txt, urls=sorted(set(re.sub(r"(https?://[^/]+).*", r"\1", u) if u.startswith("http") else u[:20] for u in re.findall(r"url\(\s*['\"]?([^'\")]+)", txt))),
            collection_list_widget="collection_list_widget" in txt,
        ))
for r in rows:
    print(r)
