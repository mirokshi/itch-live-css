# usage: python -I cssq.py <css file> <regex on selector OR declarations> [sel|decl|any]
# Tiny brace-matching CSS walker: prints "[@media ...] selector { decls }" for every style rule that matches.
import re, sys
css = re.sub(r'/\*.*?\*/', '', open(sys.argv[1], encoding='utf8').read(), flags=re.S)
pat = re.compile(sys.argv[2]); mode = sys.argv[3] if len(sys.argv) > 3 else 'any'
def walk(s, ctx):
    i = 0; n = len(s)
    while i < n:
        j = s.find('{', i)
        if j < 0: return
        head = s[i:j].strip()
        depth = 1; k = j + 1
        while k < n and depth:
            if s[k] == '{': depth += 1
            elif s[k] == '}': depth -= 1
            k += 1
        body = s[j + 1:k - 1]
        if head.startswith('@media') or head.startswith('@supports') or head.startswith('@layer') or head.startswith('@container'):
            walk(body, ctx + [head])
        elif head.startswith('@'):
            pass
        else:
            hit = (mode in ('sel', 'any') and pat.search(head)) or (mode in ('decl', 'any') and pat.search(body))
            if hit:
                sys.stdout.write(('[' + ' & '.join(ctx) + '] ' if ctx else '') + re.sub(r'\s+', ' ', head) + ' { ' + re.sub(r'\s+', ' ', body.strip()) + ' }\n')
        i = k
sys.stdout.reconfigure(encoding='utf-8')
walk(css, [])
