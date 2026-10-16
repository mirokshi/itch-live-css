# Print style rules inside @media blocks: "[ctx] selector { decls }" (flat walker). usage: python -I mediarules.py file.css ctx-regex
import re,sys
sys.stdout.reconfigure(encoding="utf-8")
f,rc=sys.argv[1],sys.argv[2]
s=re.sub(r'/\*.*?\*/','',open(f,encoding='utf8',errors='replace').read(),flags=re.S)
stack=[];buf=''
for c in s:
    if c=='{': stack.append(buf.strip()); buf=''
    elif c=='}':
        if stack:
            sel=stack.pop()
            ctx=' '.join(x for x in stack if x.startswith('@'))
            if not sel.startswith('@') and buf.strip() and ctx and re.search(rc,ctx):
                print('['+ctx+'] '+sel[:160]+' { '+buf.strip()[:160]+' }')
        buf=''
    else:
        buf+=c
        if c==';' and not stack: buf=''
