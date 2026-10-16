"""Independent minimal DOM tree builder (stdlib only) for the verifier."""
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag = tag
        self.attrs = dict(attrs)
        self.attr_order = None
        self.children = []
        self.parent = parent
        self.text = []

    @property
    def classes(self):
        return (self.attrs.get("class") or "").split()

    @property
    def id(self):
        return self.attrs.get("id")

    def elems(self):
        return [c for c in self.children if isinstance(c, Node)]

    def iter(self):
        yield self
        for c in self.elems():
            yield from c.iter()

    def find_all(self, pred):
        return [n for n in self.iter() if pred(n)]

    def first(self, pred):
        for n in self.iter():
            if pred(n):
                return n
        return None

    def sig(self):
        s = self.tag
        if self.id:
            s += "#" + self.id
        if self.classes:
            s += "." + ".".join(self.classes)
        return s

    def alltext(self):
        out = []
        for c in self.children:
            if isinstance(c, Node):
                out.append(c.alltext())
            else:
                out.append(c)
        return "".join(out)


class TB(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", [], None)
        self.cur = self.root
        self.raw_style = {}

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        n.attr_order = [a for a, _ in attrs]
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        n.attr_order = [a for a, _ in attrs]
        self.cur.children.append(n)

    def handle_endtag(self, tag):
        c = self.cur
        while c is not None and c.tag != tag:
            c = c.parent
        if c is not None and c.parent is not None:
            self.cur = c.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def parse(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        html = f.read()
    tb = TB()
    tb.feed(html)
    return tb.root, html
