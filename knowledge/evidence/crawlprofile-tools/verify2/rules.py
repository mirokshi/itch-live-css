import sys,re
sys.stdout.reconfigure(encoding="utf-8")
css=open(sys.argv[1],encoding='utf-8').read()
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
out=[];stack=[];buf='';i=0
while i<len(css):
    c=css[i]
    if c in '"\'':
        j=css.index(c,i+1); buf+=css[i:j+1]; i=j+1; continue
    if c=='{': stack.append(buf.strip()); buf=''
    elif c=='}':
        if buf.strip(): out.append((' @@ '.join(stack),buf.strip()))
        buf=''
        if stack: stack.pop()
    else: buf+=c
    i+=1
pats=sys.argv[2:]
print(len(out),'rules')
for s,b in out:
    if any(re.search(p,s) for p in pats): print(s,'{',b[:400],'}')
