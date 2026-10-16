import sys, re
def sels(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'"[^"]*"|\'[^\']*\'', '""', css)
    out = []; depth_stack = []
    # tokenise top-level-ish: capture preludes before '{'
    buf = ''; stack = []
    for ch in css:
        if ch == '{':
            pre = buf.strip(); buf = ''
            stack.append(pre)
            if pre and not pre.startswith('@') and not re.match(r'^(from|to|[\d.]+%)(\s*,\s*(from|to|[\d.]+%))*$', pre):
                # nested selector inside a style rule? record with parent chain
                parents = [p for p in stack[:-1] if p and not p.startswith('@')]
                for s in pre.split(','):
                    out.append((s.strip(), bool(parents)))
        elif ch == '}':
            if stack: stack.pop()
            buf = ''
        elif ch == ';':
            buf = ''
        else:
            buf += ch
    return out
print('file | top-level selectors | under #wrapper | global body/html/:root/* | .footer | user-select:none | !important')
for p in sys.argv[1:]:
    c = open(p, encoding='utf-8', errors='replace').read()
    ss = [s for s, nested in sels(c) if not nested]
    sc = [s for s in ss if s.startswith('#wrapper') or s.startswith('.user_page_wrap') or s.startswith('.jam_page_wrap')]
    gl = [s for s in ss if re.match(r'^(body|html|:root|\*)(?![\w-])', s)]
    ft = [s for s in ss if 'footer' in s]
    print(f"{p.split('/')[-1][:55]:55} | {len(ss):3} | {len(sc):3} ({(100*len(sc)//len(ss)) if ss else 0}%) | {len(gl)} | {len(ft)} | {'user-select:none' in c.replace(' ','')} | {c.count('!important')}")
