"""Verifier's own analyzer of user-content containers in saved itch pages.
Usage: python -I vanalyze.py <file_or_dir> [...]  -> prints JSON summary
Raw-source based: finds container start tags by class tokens, then extracts the container's raw
inner HTML by tag-depth counting on the raw string (so entity spelling is preserved).
"""
import collections
import json
import os
import re
import sys
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


def kind_of(classes):
    c = set(classes)
    if "formatted_description" in c:
        return "project"
    if "object_text_widget_widget" in c:
        return "devlog"
    if "jam_content" in c:
        return "jam"
    if "user_profile" in c:
        return "profile"
    if "post_body" in c and "user_formatted" in c:
        return "comment"
    return None


class Finder(HTMLParser):
    """Records raw spans of containers."""

    def __init__(self, raw):
        super().__init__(convert_charrefs=False)
        self.raw = raw
        self.stack = []  # (tag, kind or None, start offset of inner)
        self.containers = []
        lines = raw.split("\n")
        self.line_off = [0]
        for ln in lines:
            self.line_off.append(self.line_off[-1] + len(ln) + 1)

    def off(self):
        ln, col = self.getpos()
        return self.line_off[ln - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        cls = (dict(attrs).get("class") or "").split()
        k = kind_of(cls)
        start = self.off()
        end_of_tag = self.raw.index(">", start) + 1
        self.stack.append((tag, k, end_of_tag))

    def handle_endtag(self, tag):
        # pop to matching tag
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                t, k, inner = self.stack[i]
                del self.stack[i:]
                if k and not any(s[1] for s in self.stack):
                    self.containers.append((k, self.raw[inner:self.off()]))
                elif k:
                    self.containers.append((k, self.raw[inner:self.off()]))
                return


class Inner(HTMLParser):
    def __init__(self, stats, kind):
        super().__init__(convert_charrefs=False)
        self.s = stats
        self.k = kind

    def handle_starttag(self, tag, attrs):
        s, k = self.s, self.k
        s["tags"][k][tag] += 1
        a = dict(attrs)
        for name, val in attrs:
            s["attrs"][k][f"{tag}[{name}]"] += 1
        if "id" in a:
            s["ids"][k] += 1
        for t in (a.get("class") or "").split():
            if not t.startswith("custom"):
                s["class_tokens"][k][t] += 1
            else:
                s["custom_prefix"][k][re.match(r"custom[-_]?", t).group(0)] += 1
        if "style" in a:
            v = a["style"] or ""
            s["style_end"]["empty" if v == "" else ("semicolon" if v.rstrip().endswith(";") else "no_semicolon")] += 1
            for decl in v.split(";"):
                if ":" in decl:
                    s["style_props"][k if tag != "button" else "itch_button"][decl.split(":")[0].strip()] += 1
        if tag == "a":
            href = a.get("href")
            if href is None:
                host = "NOHREF"
            elif href.startswith("mailto:"):
                host = "mailto"
            else:
                m = re.match(r"^(?:https?:)?//([^/?#]+)", href)
                host = ("itch" if m and (m.group(1) == "itch.io" or m.group(1).endswith(".itch.io")) else "external") if m else "relative:" + href[:10]
            key = (host, a.get("rel"), a.get("referrerpolicy"))
            s["links"][str(key)] += 1
            if "target" in a:
                s["target"][a["target"]] += 1
        if tag == "img":
            s["img_loading"][str(a.get("loading"))] += 1
            src = a.get("src") or ""
            s["img_host"][re.sub(r"^(https?:)?//([^/]+).*", r"\2", src) if src else "NOSRC"] += 1
        if tag == "iframe":
            s["iframe_attrs"].update(n for n, _ in attrs)
            s["iframe_hosts"][re.sub(r"^(https?:)?//([^/]+).*", r"\2", a.get("src") or "")] += 1
        if tag == "details" and "open" in a:
            s["details_open"] += 1

    def handle_data(self, data):
        s = self.s
        s["raw_quote_sq"] += data.count("'")
        s["raw_quote_dq"] += data.count('"')
        s["raw_gt"] += data.count(">")

    def handle_entityref(self, name):
        self.s["entities"]["&" + name] += 1

    def handle_charref(self, name):
        self.s["entities"]["&#" + name] += 1

    def handle_comment(self, data):
        self.s["comments"] += 1


def new_stats():
    dd = lambda: collections.defaultdict(collections.Counter)
    return {
        "containers": collections.Counter(), "tags": dd(), "attrs": dd(), "ids": collections.Counter(),
        "class_tokens": dd(), "custom_prefix": dd(), "style_end": collections.Counter(), "style_props": dd(),
        "links": collections.Counter(), "target": collections.Counter(), "img_loading": collections.Counter(),
        "img_host": collections.Counter(), "iframe_attrs": collections.Counter(), "iframe_hosts": collections.Counter(),
        "details_open": 0, "raw_quote_sq": 0, "raw_quote_dq": 0, "raw_gt": 0, "entities": collections.Counter(),
        "comments": 0, "empty_p": collections.Counter(), "files": 0,
    }


def main(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            files += [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.endswith(".html")]
        else:
            files.append(p)
    s = new_stats()
    for f in files:
        raw = open(f, encoding="utf-8", errors="replace").read()
        fd = Finder(raw)
        fd.feed(raw)
        s["files"] += 1
        for k, inner in fd.containers:
            s["containers"][k] += 1
            s["empty_p"][k] += len(re.findall(r"<p>\s*</p>", inner))
            ip = Inner(s, k)
            ip.feed(inner)
    print(json.dumps(s, indent=1, default=lambda o: dict(o)))


if __name__ == "__main__":
    main(sys.argv[1:])
