# Flatten a (minified) CSS file into (media-context, selector, declarations) and grep selectors/declarations.
# usage: python -I rules.py file.css <selector-regex> [<decl-regex>]
import re, sys
sys.stdout.reconfigure(encoding="utf-8")
s = open(sys.argv[1], encoding='utf8').read()
s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
selrx = re.compile(sys.argv[2]); declrx = re.compile(sys.argv[3] if len(sys.argv) > 3 else '.')
out = []
def parse(txt, ctx):
    i = 0; n = len(txt)
    while i < n:
        j = txt.find('{', i)
        if j < 0: break
        head = txt[i:j].strip()
        # find matching brace
        d = 1; k = j + 1
        while k < n and d:
            if txt[k] == '{': d += 1
            elif txt[k] == '}': d -= 1
            k += 1
        body = txt[j+1:k-1]
        if head.startswith('@media') or head.startswith('@supports') or head.startswith('@layer'):
            parse(body, ctx + [head])
        elif head.startswith('@'):
            pass
        else:
            if '{' in body:  # nested rule (CSS nesting)
                decls = re.sub(r'[^;{}]*\{[^{}]*\}', '', body)
                out.append((' / '.join(ctx), head, decls))
                for m in re.finditer(r'([^;{}]+)\{([^{}]*)\}', body):
                    out.append((' / '.join(ctx), head + ' >> ' + m.group(1).strip(), m.group(2)))
            else:
                out.append((' / '.join(ctx), head, body))
        i = k
parse(s, [])
for ctx, sel, decl in out:
    if selrx.search(sel) and declrx.search(decl):
        print(f'[{ctx}] {sel} {{{decl.strip()[:300]}}}')
