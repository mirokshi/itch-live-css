# usage: python -I cssrules.py file.css regex  -> prints [media ctx] selector {body} for rules whose selector matches regex
import re,sys
sys.stdout.reconfigure(encoding='utf-8')
css=open(sys.argv[1],encoding='utf8').read(); pat=re.compile(sys.argv[2])
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
def walk(s,ctx=''):
    i=0
    while i<len(s):
        j=s.find('{',i)
        if j<0: break
        sel=s[i:j].strip(); d=1;k=j+1
        while d and k<len(s):
            if s[k]=='{': d+=1
            elif s[k]=='}': d-=1
            k+=1
        body=s[j+1:k-1]
        if sel.startswith('@media') or sel.startswith('@supports') or sel.startswith('@layer') or sel.startswith('@container'):
            walk(body,ctx+'['+sel+'] ')
        elif pat.search(sel): print(ctx+sel[:200],'{',body[:260],'}')
        i=k
walk(css)
