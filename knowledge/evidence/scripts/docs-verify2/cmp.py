# usage: python -I cmp.py a_text b_text  -> word counts, SequenceMatcher ratio, non-equal opcodes (words)
import sys,re,difflib,hashlib
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
def words(p):
    t=open(p,encoding='utf-8',errors='replace').read()
    t=t.replace('’',"'").replace('`','')
    t=re.sub(r'<[^>]+>',' ',t)                      # md copy keeps raw fieldset html
    t=re.sub(r'\[legend: |\]|\[|\]|#+|\*\*|\(#[^)]*\)|\(https?://[^)]*\)|\(/[^)]*\)',' ',t)
    return re.findall(r"[A-Za-z0-9_.#:@'-]+",t)
a,b=words(sys.argv[1]),words(sys.argv[2])
print('words',len(a),len(b),'sha1',hashlib.sha1(' '.join(a).encode()).hexdigest()[:12],hashlib.sha1(' '.join(b).encode()).hexdigest()[:12])
sm=difflib.SequenceMatcher(None,a,b,autojunk=False); print('ratio %.3f'%sm.ratio())
for op,i1,i2,j1,j2 in sm.get_opcodes():
    if op!='equal': print(op,'A:',' '.join(a[i1:i2])[:300],'| B:',' '.join(b[j1:j2])[:300])
