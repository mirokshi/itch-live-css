"""Scope checker for compiled framework CSS (gapfill-08, 2026-10-14).
usage: python -I scopecheck.py [--classes PREFIX] file.css [...]
Walks the CSS (comments stripped), descends into @media/@supports/@layer/@container/@scope blocks,
and reports: style rules, selectors NOT starting with '#wrapper', selectors containing ':root'/'*'/'::backdrop',
@property / @keyframes / @font-face / @layer counts, class tokens not starting with PREFIX, and byte size.
"""
import re, sys, collections

BS = chr(92)  # backslash
args = sys.argv[1:]
prefix = None
if args and args[0] == '--classes':
    prefix = args[1]
    args = args[2:]


def strip(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def split_sel(pre):
    out, depth, cur = [], 0, ''
    i = 0
    while i < len(pre):
        ch = pre[i]
        if ch == BS and i + 1 < len(pre):
            cur += ch + pre[i + 1]
            i += 2
            continue
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        if ch == ',' and depth == 0:
            out.append(cur.strip())
            cur = ''
        else:
            cur += ch
        i += 1
    if cur.strip():
        out.append(cur.strip())
    return out


def walk(s, ctx, acc):
    i, n = 0, len(s)
    while i < n:
        j = s.find('{', i)
        if j < 0:
            rest = s[i:].strip()
            for st in [x.strip() for x in rest.split(';') if x.strip()]:
                acc['statements'].append((st, tuple(ctx)))
            break
        pre = s[i:j]
        if ';' in pre:
            parts = pre.split(';')
            for st in parts[:-1]:
                if st.strip():
                    acc['statements'].append((st.strip(), tuple(ctx)))
            pre = parts[-1]
        pre = pre.strip()
        d, k = 1, j + 1
        while k < n and d:
            if s[k] == '{':
                d += 1
            elif s[k] == '}':
                d -= 1
            k += 1
        body = s[j + 1:k - 1]
        if re.match(r'@(media|supports|layer|container|scope)\b', pre):
            acc['at'][pre.split()[0]] += 1
            acc['blocks'].append((pre, tuple(ctx)))
            walk(body, ctx + [pre], acc)
        elif pre.startswith('@'):
            acc['at'][pre.split()[0]] += 1
            acc['atrules'].append((pre, tuple(ctx)))
        else:
            acc['rules'].append((pre, body, tuple(ctx)))
        i = k


CLS = re.compile(r'\.(-?(?:[_a-zA-Z]|' + re.escape(BS) + r'.)(?:[\w-]|' + re.escape(BS) + r'.)*)')

for path in args:
    raw = open(path, encoding='utf-8').read()
    css = strip(raw)
    acc = {'rules': [], 'atrules': [], 'blocks': [], 'statements': [], 'at': collections.Counter()}
    walk(css, [], acc)
    sels = [(sel, ctx) for pre, body, ctx in acc['rules'] for sel in split_sel(pre)]
    in_kf = lambda c: any(x.startswith('@keyframes') for x in c)
    unscoped = [(s, c) for s, c in sels if not s.startswith('#wrapper')]
    rootish = [(s, c) for s, c in sels if re.search(r':root|(^|[\s,>+~(])\*|::backdrop|:host|^html\b|^body\b', s)]
    bad_cls = collections.Counter()
    if prefix:
        for s, c in sels:
            for cl in CLS.findall(s):
                cl2 = cl.replace(BS, '')
                if not cl2.startswith(prefix):
                    bad_cls[cl2] += 1
    print(f'== {path.replace(BS, "/").split("/")[-1]}: bytes={len(raw.encode("utf-8"))} style_rules={len(acc["rules"])} '
          f'selectors={len(sels)} unscoped={len(unscoped)} rootish={len(rootish)} at={dict(acc["at"])} '
          f'statements={[st[:60] for st, c in acc["statements"]][:6]} important={css.count("!important")}')
    for s, c in unscoped[:40]:
        print('   UNSCOPED:', s[:110], ' ctx=', [x[:40] for x in c])
    if len(unscoped) > 40:
        print('   ... +', len(unscoped) - 40)
    for s, c in rootish[:10]:
        print('   ROOTISH:', s[:110], ' ctx=', [x[:40] for x in c])
    for a, c in acc['atrules'][:14]:
        print('   AT:', a[:80], ' ctx=', [x[:40] for x in c])
    if prefix:
        print(f'   classes not starting with {prefix!r}: {sum(bad_cls.values())} occurrences, {len(bad_cls)} distinct:',
              list(bad_cls)[:40])
