import sys,re
def rules(css):
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    out=[];stack=[];buf='';i=0
    while i<len(css):
        c=css[i]
        if c in '"\'':
            j=css.index(c,i+1); buf+=css[i:j+1]; i=j+1; continue
        if c=='{':
            stack.append(buf.strip()); buf=''
        elif c=='}':
            if buf.strip(): out.append((tuple(stack),buf.strip()))
            buf=''; stack.pop() if stack else None
        elif c==';' and stack and False: pass
        else: buf+=c
        i+=1
    return out
if __name__=='__main__':
    css=open(sys.argv[1],encoding='utf-8').read()
    kws=sys.argv[2:]
    for ctx,decl in rules(css):
        s=' >> '.join(ctx)
        if any(k in s for k in kws):
            # decl may include nested selectors; keep only top-level declarations
            print(s,'{',decl[:300],'}')
