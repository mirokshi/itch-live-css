"""Checks behind knowledge/sections/04-theme-editor-and-itch-css.md ("Section notes", s04-*).

Usage (read-only, no network):
    python -I s04_checks.py <RAW_DIR> [<DOM_DUMP.html> ...]

RAW_DIR must hold logged-out copies fetched with curl on 2026-10-14:
    user.css game.css jam.css user.min.js bundle.min.js         (static.itch.io)
    profile_mirokshi.html profile_leafo.html                    (<user>.itch.io/)
    project_xmoon.html project_deltarune.html project_cbr.html  (project pages)
    jam_lve.html jam_gdev10.html jam_gmtk25.html                (jam overviews)
DOM_DUMP files are headless-browser --dump-dom outputs of a profile (optional).
Prints statistics only; it never writes third-party content anywhere.
"""
import hashlib
import os
import re
import sys


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def style_block(html, style_id):
    m = re.search(r'<style[^>]*id="%s"[^>]*>(.*?)</style>' % style_id, html, re.S)
    return m.group(1) if m else None


def flat_rules(css):
    """(selector, declarations) for every innermost block; @-rule preludes skipped."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out, stack, buf = [], [], ""
    for c in css:
        if c == "{":
            stack.append(buf.strip())
            buf = ""
        elif c == "}":
            if stack:
                sel = stack.pop()
                if buf.strip() and not sel.startswith("@"):
                    out.append((sel, buf.strip()))
            buf = ""
        else:
            buf += c
    return out


def selectors(css):
    return [m.group(1).strip() for m in re.finditer(r"([^{};]+)\{", css)]


def luminance(hexcolor):
    h = hexcolor.lstrip("#")
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def main():
    raw = sys.argv[1]
    p = lambda name: os.path.join(raw, name)

    print("## s04-1 jam host CSS location")
    for f in ("jam_lve.html", "jam_gdev10.html", "jam_gmtk25.html"):
        html = read(p(f))
        t = style_block(html, "jam_theme")
        end = t.find("}", t.find(".jam_filter_picker .divider")) + 1
        gen = t[:end]
        tail = t[end:].strip()
        print(f, "custom_css element:", 'id="custom_css"' in html,
              "| generated chars:", len(gen), "| host chars after generated rules:", len(tail),
              "| host starts with @import:", tail.startswith("@import"),
              "| generated selectors:", len(selectors(gen)), "| generated !important:", gen.count("!important"))

    print("\n## s04-2 project game_theme literal colours")
    for f in ("project_xmoon.html", "project_deltarune.html", "project_cbr.html"):
        t = style_block(read(p(f)), "game_theme")
        link = re.search(r"--itchio_link_color:\s*(#[0-9a-fA-F]{6})", t).group(1).lower()
        lit = [s for s, d in flat_rules(t) if link in d.lower() and s != ".wrapper"]
        print(f, "rules:", len(flat_rules(t)), "| var() uses:", t.count("var("),
              "| !important:", t.count("!important"), "| ID selectors:",
              sum("#" in s for s in selectors(t)))
        print("   literal link-colour selectors:", [s[:60] for s in lit][:6])

    print("\n## s04-3 profile user_theme format")
    for f in ("profile_mirokshi.html", "profile_leafo.html"):
        t = style_block(read(p(f)), "user_theme")
        print(f, "chars:", len(t), "| newlines:", t.count("\n"), "| ': ' pairs:", t.count(": "),
              "| !important:", t.count("!important"), "| ID selectors:",
              sum("#" in s for s in selectors(t)),
              "| empty .user_page_wrap{}:", ".user_page_wrap{}" in t)

    print("\n## s04-4 bundles: ID selectors, !important, @media")
    for f in ("user.css", "game.css", "jam.css"):
        css = read(p(f))
        ids = set()
        for sel, _ in flat_rules(css):
            for part in sel.split(","):
                ids.update(re.findall(r"#[A-Za-z_][\w-]*", re.sub(r"\[[^\]]*\]", "", part)))
        media = {}
        for m in re.findall(r"@media[^{]*", css):
            media[m.strip()] = media.get(m.strip(), 0) + 1
        print(f, len(css.encode()), "bytes, md5", hashlib.md5(css.encode()).hexdigest(),
              "| IDs:", sorted(ids), "| !important:", css.count("!important"),
              "| @media blocks:", sum(media.values()))
        print("   ", sorted(media.items(), key=lambda kv: -kv[1])[:6])
        print("   var(--itchio_link_color):", css.count("var(--itchio_link_color"),
              "| var(--itchio_button_color:", css.count("var(--itchio_button_color"),
              "| var(--itchio_ui_bg_dark:", css.count("var(--itchio_ui_bg_dark"))

    print("\n## s04-6/s04-7 runtime sizer + inline min-height")
    um, bm = read(p("user.min.js")), read(p("bundle.min.js"))
    print("user.min.js UserLayout calls .user_page_wrap max_height:",
          bool(re.search(r'UserLayout=function\(\)\{function e\(t\)\{this\.el=\$\(t\),\$\("\.user_page_wrap"\)\.max_height', um)))
    print("bundle.min.js $.fn.max_height sets min-height on resize:",
          bool(re.search(r'\$\.fn\.max_height=function.{0,200}css\("min-height"', bm)))
    print("bundle.min.js appends <style itchio-grid-sizer>:", "itchio-grid-sizer" in bm)
    for dump in sys.argv[2:]:
        d = read(dump)
        w = re.search(r'<div[^>]*id="wrapper"[^>]*>', d)
        sizers = re.findall(r"<style itchio-grid-sizer[^>]*>(.*?)</style>", d, re.S)
        after = d.find('id="custom_css"') < d.find("itchio-grid-sizer")
        print(os.path.basename(dump), "| wrapper tag:", w.group(0) if w else None,
              "| sizers:", len(sizers), "| after custom_css:", after)
        for s in sizers:
            print("    ", " ".join(s.split()))

    print("\n## s04-5 contrast of itch's focus colour")
    for bg in ("#0b1433", "#000000", "#222222", "#ffffff", "#eeeeee"):
        print("#361275 vs", bg, round(contrast("#361275", bg), 2))


if __name__ == "__main__":
    main()
