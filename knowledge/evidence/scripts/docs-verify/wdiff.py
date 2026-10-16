import sys, difflib
sys.stdout.reconfigure(encoding="utf-8")
# usage: wdiff.py old.html new.html -- word-level diff of normalized guide bodies
import re, html
def body(p):
    s=open(p,encoding='utf-8',errors='replace').read()
    s=re.sub(r'<(script|style)[^>]*>.*?</\1>','',s,flags=re.S)
    i=s.find('CSS Customization Guide</h1>')
    if i<0: i=s.find('CSS Customization Guide')
    j=s.find('Follow itch.io on',i)
    if j<0: j=s.find('class="footer',i)
    t=html.unescape(re.sub(r'<[^>]+>',' ',s[i:j])); return t.replace('’',"'").split()
a,b=body(sys.argv[1]),body(sys.argv[2])
sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
print('ratio %.3f'%sm.ratio())
for op,i1,i2,j1,j2 in sm.get_opcodes():
    if op!='equal': print(op.upper(),'| -',' '.join(a[i1:i2])[:400],'| +',' '.join(b[j1:j2])[:600])
