# usage: python -I rules.py <css> <regex on declarations or selector>  -> prints (context) selector { matching decls }
import re,sys
sys.stdout.reconfigure(encoding='utf-8')
css=open(sys.argv[1],encoding='utf8').read()
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
pat=re.compile(sys.argv[2])
mode=sys.argv[3] if len(sys.argv)>3 else 'decl'
def walk(s,ctx):
    i=0
    while i<len(s):
        j=s.find('{',i)
        if j<0: break
        pre=s[i:j].strip()
        # find matching brace
        d=0;k=j
        while k<len(s):
            if s[k]=='{': d+=1
            elif s[k]=='}':
                d-=1
                if d==0: break
            k+=1
        body=s[j+1:k]
        if pre.startswith('@media') or pre.startswith('@supports') or pre.startswith('@layer'):
            walk(body,ctx+[pre])
        elif pre.startswith('@'):
            pass
        else:
            decls=[x.strip() for x in body.split(';') if x.strip()]
            if mode=='decl':
                m=[x for x in decls if pat.search(x)]
                if m: print(('['+' '.join(ctx)+'] ' if ctx else '')+pre[:160],'{',';'.join(m),'}')
            else:
                if pat.search(pre): print(('['+' '.join(ctx)+'] ' if ctx else '')+pre[:160],'{',';'.join(decls)[:300],'}')
        i=k+1
walk(css,[])
