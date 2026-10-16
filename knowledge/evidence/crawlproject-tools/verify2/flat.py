# Flatten a CSS file into (media, selector, body) rows; grep with a regex on selector (and optional regex on body).
import sys, re
def flatten(css):
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    rows=[]; i=0; stack=[]
    buf=''
    n=len(css)
    while i<n:
        c=css[i]
        if c=='{':
            pre=buf.strip(); buf=''
            if pre.startswith('@media') or pre.startswith('@supports') or pre.startswith('@layer') or pre.startswith('@container'):
                stack.append(pre); i+=1; continue
            # find matching close
            depth=1; j=i+1
            while j<n and depth:
                if css[j]=='{': depth+=1
                elif css[j]=='}': depth-=1
                j+=1
            body=css[i+1:j-1].strip()
            rows.append((' & '.join(stack), pre, body)); i=j; continue
        if c=='}':
            if stack: stack.pop()
            buf=''; i+=1; continue
        if c==';' and buf.strip().startswith('@'):
            rows.append(('', buf.strip(), '')); buf=''; i+=1; continue
        buf+=c; i+=1
    return rows
if __name__=='__main__':
    rows=flatten(open(sys.argv[1],encoding='utf-8').read())
    sel=re.compile(sys.argv[2]) if len(sys.argv)>2 else None
    bod=re.compile(sys.argv[3]) if len(sys.argv)>3 else None
    for m,s,b in rows:
        if sel and not sel.search(s): continue
        if bod and not bod.search(b): continue
        print(f'[{m}] {s} {{{b[:300]}}}')
