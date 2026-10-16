"""Flatten a stylesheet into (media, selector, body) rows and grep them.
usage: python -I vcss.py file.css 'regex-on-selector' ['regex-on-body']"""
import sys, re

def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)

def parse(s, media=''):
    out = []; i = 0; n = len(s)
    while i < n:
        j = s.find('{', i)
        if j < 0: break
        pre = s[i:j].strip()
        # find matching brace
        depth = 1; k = j + 1
        while k < n and depth:
            if s[k] == '{': depth += 1
            elif s[k] == '}': depth -= 1
            k += 1
        body = s[j+1:k-1]
        # handle statements like @import ...; before the selector
        if ';' in pre and not pre.startswith('@media'):
            pre = pre.split(';')[-1].strip()
        if pre.startswith('@media') or pre.startswith('@supports') or pre.startswith('@container'):
            out += parse(body, (media + ' ' + pre).strip())
        else:
            out.append((media, pre, body.strip()))
        i = k
    return out

if __name__ == '__main__':
    css = strip_comments(open(sys.argv[1], encoding='utf-8', errors='replace').read())
    rows = parse(css)
    if len(sys.argv) == 2:
        print(len(rows), 'rules'); sys.exit()
    sre = re.compile(sys.argv[2]); bre = re.compile(sys.argv[3]) if len(sys.argv) > 3 else None
    for m, sel, body in rows:
        if sre.search(sel) and (bre is None or bre.search(body)):
            print(f'[{m}] {sel} {{{body[:300]}}}')
