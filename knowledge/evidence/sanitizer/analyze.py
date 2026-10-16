"""Analyze user-authored content containers in saved itch.io pages.

Usage: python -I analyze.py <pages_dir> <out_json>

Container kinds (by class tokens on the element):
  project : formatted_description + user_formatted
  devlog  : object_text_widget_widget + post_body + user_formatted
  jam     : jam_content + user_formatted
  profile : user_profile + formatted
  comment : post_body + user_formatted (community comment/post bodies)
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
from urllib.parse import urlparse

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}


def kind_of(classes):
    c = set(classes)
    if "formatted_description" in c and "user_formatted" in c:
        return "project"
    if "object_text_widget_widget" in c and "user_formatted" in c:
        return "devlog"
    if "jam_content" in c and "user_formatted" in c:
        return "jam"
    if "user_profile" in c and "formatted" in c:
        return "profile"
    if "post_body" in c and "user_formatted" in c:
        return "comment"
    return None


class P(HTMLParser):
    def __init__(self, stats, page):
        super().__init__(convert_charrefs=False)
        self.stats = stats
        self.page = page
        self.stack = []  # (tag, kind_started_here)
        self.kind = None
        self.depth_at_start = None
        self.raw = []

    def handle_starttag(self, tag, attrs):
        self._start(tag, attrs, selfclosing=False)

    def handle_startendtag(self, tag, attrs):
        self._start(tag, attrs, selfclosing=True)

    def _start(self, tag, attrs, selfclosing):
        ad = dict(attrs)
        classes = (ad.get("class") or "").split()
        if self.kind is None:
            k = kind_of(classes)
            if k and tag not in VOID:
                self.kind = k
                self.depth_at_start = len(self.stack)
                self.stack.append(tag)
                self.stats[k]["containers"] += 1
                self.stats[k]["pages"].add(self.page)
                self.raw.append((k, self.getpos()))
                return
        if self.kind is not None:
            s = self.stats[self.kind]
            s["tags"][tag] += 1
            s["tag_pages"][tag].add(self.page)
            for name, val in attrs:
                s["attrs"][f"{tag}[{name}]"] += 1
                s["attr_pages"][f"{tag}[{name}]"].add(self.page)
                if name == "class" and val is not None:
                    s["class_values"][f"{tag}.{val}"] += 1
                if name == "class" and val:
                    for t in val.split():
                        s["classes"][t] += 1
                        s["class_pages"][t].add(self.page)
                if name == "style" and val:
                    for decl in val.split(";"):
                        if ":" in decl:
                            prop = decl.split(":", 1)[0].strip().lower()
                            s["style_props"][prop] += 1
                    s["style_samples"][val.strip()[:120]] += 1
                if name == "id":
                    s["ids"][val] += 1
                if name.startswith("data-"):
                    s["data_attrs"][name] += 1
                if name.startswith("aria-") or name == "role":
                    s["aria"][f"{name}={val}"] += 1
                if tag == "iframe" and name == "src" and val:
                    s["iframe_hosts"][urlparse(val if not val.startswith("//") else "https:" + val).netloc] += 1
                if tag == "a" and name == "href" and val:
                    s["href_schemes"][(urlparse(val).scheme or ("//" if val.startswith("//") else "relative"))] += 1
                if tag == "a" and name in ("rel", "target"):
                    s["a_rel_target"][f"{name}={val}"] += 1
                if tag == "img" and name == "src" and val:
                    s["img_hosts"][urlparse(val).netloc or "relative"] += 1
            if tag not in VOID and not selfclosing:
                self.stack.append(tag)
            return
        if tag not in VOID and not selfclosing:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        # pop to matching tag
        if tag in VOID:
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i] == tag:
                del self.stack[i:]
                break
        if self.kind is not None and len(self.stack) <= self.depth_at_start:
            self.kind = None
            self.depth_at_start = None

    def handle_data(self, data):
        if self.kind is not None:
            self.stats[self.kind]["text"].append(data)

    def handle_entityref(self, name):
        if self.kind is not None:
            self.stats[self.kind]["text"].append(f"&{name};")

    def handle_charref(self, name):
        if self.kind is not None:
            self.stats[self.kind]["text"].append(f"&#{name};")

    def handle_comment(self, data):
        if self.kind is not None:
            self.stats[self.kind]["comments"] += 1


def new_stats():
    return {
        "containers": 0, "pages": set(), "tags": Counter(), "tag_pages": defaultdict(set),
        "attrs": Counter(), "attr_pages": defaultdict(set), "classes": Counter(),
        "class_pages": defaultdict(set), "class_values": Counter(), "style_props": Counter(), "style_samples": Counter(),
        "ids": Counter(), "data_attrs": Counter(), "aria": Counter(), "iframe_hosts": Counter(),
        "href_schemes": Counter(), "a_rel_target": Counter(), "img_hosts": Counter(),
        "text": [], "comments": 0,
    }


def main():
    pages_dir, out = sys.argv[1], sys.argv[2]
    stats = defaultdict(new_stats)
    for fn in sorted(os.listdir(pages_dir)):
        if not fn.endswith(".html"):
            continue
        with open(os.path.join(pages_dir, fn), encoding="utf-8", errors="replace") as fh:
            html = fh.read()
        if len(html) < 2000:
            continue
        p = P(stats, fn)
        p.feed(html)
    result = {}
    for k, s in stats.items():
        text = "".join(s["text"])
        escaped_tags = Counter(m.lower() for m in re.findall(r"&lt;\s*/?\s*([A-Za-z][A-Za-z0-9-]*)", text))
        result[k] = {
            "containers": s["containers"],
            "pages": len(s["pages"]),
            "tags": {t: [n, len(s["tag_pages"][t])] for t, n in s["tags"].most_common()},
            "attrs": {a: [n, len(s["attr_pages"][a])] for a, n in s["attrs"].most_common()},
            "classes": {c: [n, len(s["class_pages"][c])] for c, n in s["classes"].most_common()},
            "class_values": dict(s["class_values"].most_common()),
            "style_props": dict(s["style_props"].most_common()),
            "style_samples": dict(s["style_samples"].most_common(25)),
            "ids": dict(s["ids"].most_common(30)),
            "data_attrs": dict(s["data_attrs"].most_common()),
            "aria": dict(s["aria"].most_common()),
            "iframe_hosts": dict(s["iframe_hosts"].most_common()),
            "href_schemes": dict(s["href_schemes"].most_common()),
            "a_rel_target": dict(s["a_rel_target"].most_common()),
            "img_hosts": dict(s["img_hosts"].most_common()),
            "escaped_tag_text": dict(escaped_tags.most_common()),
            "html_comments": s["comments"],
        }
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=1, ensure_ascii=False)
    for k, r in result.items():
        print(f"== {k}: containers={r['containers']} pages={r['pages']}")
        print("  tags:", ", ".join(f"{t}:{v[0]}/{v[1]}p" for t, v in r["tags"].items()))
        print("  attrs:", ", ".join(f"{t}:{v[0]}/{v[1]}p" for t, v in r["attrs"].items()))
        print("  classes:", ", ".join(f"{t}:{v[0]}/{v[1]}p" for t, v in list(r["classes"].items())[:60]))
        print("  class_values:", r["class_values"])
        print("  style_props:", r["style_props"])
        print("  style_samples:", list(r["style_samples"].items())[:25])
        print("  ids:", list(r["ids"].items())[:15])
        print("  data:", r["data_attrs"], " aria:", r["aria"])
        print("  iframe_hosts:", r["iframe_hosts"])
        print("  href_schemes:", r["href_schemes"], " rel/target:", r["a_rel_target"])
        print("  img_hosts:", r["img_hosts"])
        print("  escaped tags in text:", r["escaped_tag_text"], " comments:", r["html_comments"])


if __name__ == "__main__":
    main()
