# Flat CSS rule finder: prints "[@media ctx] selector { decls }" for rules whose selector or decls match a regex.
# usage: python -I rules.py file.css 'regex-on-selector' 'regex-on-decls'
import re,sys
sys.stdout.reconfigure(encoding="utf-8")
f,rs,rd=sys.argv[1],sys.argv[2],sys.argv[3]
s=open(f,encoding='utf8',errors='replace').read()
s=re.sub(r'/\*.*?\*/','',s,flags=re.S)
i=0;stack=[];buf='';out=[]
while i<len(s):
    c=s[i]
    if c=='{':
        stack.append(buf.strip()); buf=''
    elif c=='}':
        if stack:
            sel=stack.pop()
            if not sel.startswith('@') and buf.strip():
                ctx=' '.join(x for x in stack if x.startswith('@'))
                if re.search(rs,sel) and re.search(rd,buf):
                    print(('['+ctx+'] ' if ctx else '')+sel[:300]+' { '+buf.strip()[:300]+' }')
        buf=''
    else:
        buf+=c
        if c==';' and not stack: buf=''
    i+=1
