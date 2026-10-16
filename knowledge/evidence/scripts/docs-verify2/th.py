# usage: python -I th.py page.html styleid  -> flat-ish list of selectors (top-level and nested), --itchio vars per selector, !important decls
import sys,re
raw=open(sys.argv[1],encoding='utf-8',errors='replace').read()
m=re.search(r'<style[^>]*id="%s"[^>]*>(.*?)</style>'%re.escape(sys.argv[2]),raw,re.S)
css=m.group(1); css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
# tokenize braces
depth=0; buf=''; stack=[]; out=[]
for ch in css:
    if ch=='{':
        sel=buf.strip().split(';')[-1].strip(); stack.append(sel); out.append(('  '*depth)+sel); depth+=1; buf=''
    elif ch=='}':
        decl=buf.strip()
        if decl:
            vs=re.findall(r'(--itchio_\w+)\s*:\s*([^;]+)',decl)
            imp=[d.strip() for d in decl.split(';') if '!important' in d]
            if vs: out.append(('  '*depth)+'VARS '+', '.join(v[0] for v in vs))
            if imp: out.append(('  '*depth)+'IMPORTANT '+' | '.join(i[:60] for i in imp))
        if stack: stack.pop()
        depth-=1; buf=''
    else:
        buf+=ch
        if ch==';' and depth>0:
            pass
print('\n'.join(out))
