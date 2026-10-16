"""Second-pass analyzer: extracts user-content containers from saved itch pages and
counts sanitizer fingerprints. usage: python -I an2.py <dir> [<dir>...]  (prints JSON)"""
import sys, re, os, json, collections, html as H

KINDS = [
    ("project", re.compile(r'<div class="formatted_description user_formatted">')),
    ("devlog", re.compile(r"<section [^>]*class=\"object_text_widget_widget[^\"]*user_formatted post_body\"[^>]*>")),
    ("jam", re.compile(r'<div class="jam_content user_formatted">')),
    ("profile", re.compile(r'<div class="user_profile formatted">')),
    ("comment", re.compile(r'<div (?:class="post_body user_formatted" dir="auto"|dir="auto" class="post_body user_formatted")>')),
]
TAG = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+))?)*)\s*(/?)>')
ATTR = re.compile(r'([^\s=>/]+)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?')

def extract(doc, start):
    """return inner html of the element whose open tag ends at `start` (balanced on div/section)."""
    depth = 1
    for m in TAG.finditer(doc, start):
        name = m.group(2).lower()
        if name not in ("div", "section"):
            continue
        if m.group(1):
            depth -= 1
            if depth == 0:
                return doc[start:m.start()]
        elif not m.group(4):
            depth += 1
    return doc[start:]

def text_nodes(inner):
    # text outside tags (crude: strip tags)
    return re.sub(r'<[^>]*>', '\x00', inner)

st = collections.defaultdict(collections.Counter)
details = collections.defaultdict(list)
for d in sys.argv[1:]:
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.html'):
            continue
        doc = open(os.path.join(d, fn), encoding='utf-8', errors='replace').read()
        for kind, rx in KINDS:
            for m in rx.finditer(doc):
                inner = extract(doc, m.end())
                c = st[kind]
                c['containers'] += 1
                t = text_nodes(inner)
                c["raw'"] += t.count("'")
                c['raw"'] += t.count('"')
                c['raw>'] += t.count('>')
                c['&#x27;'] += t.count('&#x27;')
                c['&#39;'] += t.count('&#39;')
                c['&quot;'] += t.count('&quot;')
                c['&nbsp;'] += t.count('&nbsp;')
                c['&lt;'] += t.count('&lt;')
                c['<p></p>'] += inner.count('<p></p>')
                c['<p><br></p>'] += inner.count('<p><br></p>')
                for tm in TAG.finditer(inner):
                    if tm.group(1):
                        continue
                    tag = tm.group(2).lower()
                    c['tag:' + tag] += 1
                    attrs = {}
                    for am in ATTR.finditer(tm.group(3)):
                        n = am.group(1)
                        v = am.group(2)
                        if v and v[0] in '"\'':
                            v = v[1:-1]
                        attrs[n] = v
                        c['attr:%s[%s]' % (tag, n)] += 1
                    if 'id' in attrs:
                        details[kind + ':id'].append((fn, tag, attrs['id']))
                    if 'class' in attrs and tag != 'button':
                        for tok in (attrs['class'] or '').split():
                            c['class:' + (tok if not re.match(r'custom[-_]', tok) else 'custom' + tok[6] + '*')] += 1
                    if 'style' in attrs:
                        v = attrs['style'] or ''
                        c['style:total'] += 1
                        if v == '':
                            c['style:empty'] += 1
                        if v.rstrip().endswith(';'):
                            c['style:trailing;'] += 1
                        if tag != 'button':
                            for decl in v.split(';'):
                                if ':' in decl:
                                    c['styleprop:' + decl.split(':')[0].strip()] += 1
                    if tag == 'a':
                        href = attrs.get('href')
                        host = None
                        if href:
                            hm = re.match(r'(?:https?:)?//([^/:?#]+)', href)
                            host = hm.group(1).lower() if hm else None
                        if href is None:
                            k = 'a:nohref'
                        elif href.startswith('mailto:'):
                            k = 'a:mailto'
                        elif host and (host == 'itch.io' or host.endswith('.itch.io')):
                            k = 'a:itch'
                        elif host:
                            k = 'a:ext'
                        else:
                            k = 'a:other:' + href[:20]
                        c[k] += 1
                        rel = attrs.get('rel')
                        rp = attrs.get('referrerpolicy')
                        c[k + ':rel=' + str(rel) + ':rp=' + str(rp)] += 1
                        if 'target' in attrs:
                            c['a:target=' + str(attrs['target'])[:30]] += 1
                        if href and not re.match(r'(https?:)?//|mailto:', href):
                            details['badhref'].append((fn, href))
                    if tag == 'img':
                        c['img:loading=' + str(attrs.get('loading'))] += 1
                        src = attrs.get('src') or ''
                        hm = re.match(r'(?:https?:)?//([^/:?#]+)', src)
                        c['img:host=' + (hm.group(1) if hm else 'NONE:' + src[:15])] += 1
                    if tag == 'iframe':
                        details[kind + ':iframe'].append((fn, sorted(attrs.keys()), (attrs.get('src') or '')[:60]))
                    if tag == 'details' and 'open' in attrs:
                        c['details[open]'] += 1
                    if tag == 'font':
                        c['font:attrs=' + ','.join(sorted(attrs))] += 1
out = {k: dict(sorted(v.items())) for k, v in st.items()}
out['_details'] = details
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
