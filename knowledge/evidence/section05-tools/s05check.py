"""Section-05 extra checks over already-downloaded itch pages (no network).

Usage: python -I s05check.py <dir-or-file> [...]
Extracts user-content containers by class tokens and reports, per kind:
  - CR bytes in the container, CR bytes inside a tag (<...\r...>)
  - class="spoiler" occurrences
  - inline style attributes, and whether the page has style#custom_css
  - iframes / embed_preload placeholders
  - img[align], uppercase tag names, empty class attributes
Prints JSON. Only counts and page-file names, no content.
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict

KINDS = [
    ("profile", {"user_profile", "formatted"}),
    ("project", {"formatted_description", "user_formatted"}),
    ("devlog", {"post_body", "user_formatted", "object_text_widget_widget"}),
    ("jam", {"jam_content", "user_formatted"}),
    ("comment", {"post_body", "user_formatted"}),
]
OPEN_DIV = re.compile(r'<(div|section)\b[^>]*\bclass="([^"]*)"[^>]*>', re.I)
DIV_TAG = re.compile(r'<(/?)div\b[^>]*>', re.I)
TAG = re.compile(r'<(/?)([A-Za-z][A-Za-z0-9]*)\b([^>]*)>', re.S)


def kind_of(tokens):
    t = set(tokens)
    for name, need in KINDS:
        if need <= t:
            if name == "comment" and "object_text_widget_widget" in t:
                continue
            return name
    return None


def containers(html):
    for m in OPEN_DIV.finditer(html):
        k = kind_of(m.group(2).split())
        if not k:
            continue
        depth = 1
        pos = m.end()
        tagre = re.compile(r'<(/?)%s\b[^>]*>' % m.group(1), re.I)
        for d in tagre.finditer(html, pos):
            depth += -1 if d.group(1) else 1
            if depth == 0:
                yield k, html[m.end():d.start()]
                break


def files(args):
    for a in args:
        if os.path.isdir(a):
            for n in sorted(os.listdir(a)):
                if n.endswith(".html"):
                    yield os.path.join(a, n)
        else:
            yield a


def main():
    out = defaultdict(lambda: Counter())
    pages = defaultdict(list)
    seen = set()
    for f in files(sys.argv[1:]):
        raw = open(f, "rb").read()
        html = raw.decode("utf-8", "replace")
        has_custom_css = 'id="custom_css"' in html
        for k, body in containers(html):
            key = (k, hash(body))
            if key in seen:  # same container fetched twice in different corpora
                out[k]["dup_skipped"] += 1
                continue
            seen.add(key)
            c = out[k]
            c["containers"] += 1
            crs = body.count("\r")
            c["cr_bytes"] += crs
            if crs:
                c["containers_with_cr"] += 1
            in_tag = sum(1 for t in TAG.finditer(body) if "\r" in t.group(0))
            c["tags_containing_cr"] += in_tag
            lf_in_tag = sum(1 for t in TAG.finditer(body) if "\n" in t.group(0))
            c["tags_containing_lf"] += lf_in_tag
            sp = len(re.findall(r'class="[^"]*\bspoiler\b', body))
            c["spoiler"] += sp
            if sp:
                pages[k + ":spoiler"].append(os.path.basename(f))
            st = len(re.findall(r'\sstyle="', body))
            emb = len(re.findall(r'embed_preload', body))
            st_user = st - len(re.findall(r'<button[^>]*embed_preload[^>]*style="', body))
            c["style_attrs_user"] += st_user
            if st_user:
                c["containers_with_style"] += 1
                c["containers_with_style_and_custom_css" if has_custom_css else "containers_with_style_no_custom_css"] += 1
                if not has_custom_css:
                    pages[k + ":style_no_css"].append(os.path.basename(f))
            c["iframe"] += len(re.findall(r'<iframe\b', body, re.I))
            c["embed_preload_buttons"] += len(re.findall(r'<button[^>]*embed_preload', body))
            c["img_align"] += len(re.findall(r'<img\b[^>]*\salign=', body, re.I))
            c["uppercase_tags"] += sum(1 for t in TAG.finditer(body) if t.group(2) != t.group(2).lower())
            c["empty_class_attr"] += len(re.findall(r'\sclass=""', body))
            c["details_open"] += len(re.findall(r'<details\b[^>]*\sopen\b', body))
            c["a_without_href"] += sum(1 for t in TAG.finditer(body) if t.group(2) == "a" and not t.group(1) and "href=" not in t.group(3))
            c["html_comment_text"] += body.count("&lt;!--")
    print(json.dumps({"counts": out, "pages": pages}, indent=1, default=dict))


if __name__ == "__main__":
    main()
