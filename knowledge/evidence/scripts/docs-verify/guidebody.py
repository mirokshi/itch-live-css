import sys, re, html, hashlib
sys.stdout.reconfigure(encoding="utf-8")
# usage: guidebody.py file.html... -- extracts the guide article (from <h1>CSS Customization Guide to the footer), normalizes whitespace, prints words + sha1
def body(p):
    s=open(p,encoding='utf-8',errors='replace').read()
    s=re.sub(r'<(script|style)[^>]*>.*?</\1>','',s,flags=re.S)
    i=s.find('CSS Customization Guide</h1>')
    if i<0: i=s.find('CSS Customization Guide')
    j=s.find('Follow itch.io on',i)
    if j<0: j=s.find('class="footer',i)
    t=s[i:j]
    t=html.unescape(re.sub(r'<[^>]+>',' ',t)); t=' '.join(t.split())
    t=t.replace('’',"'")
    return t
for p in sys.argv[1:]:
    t=body(p); print('%-28s words=%5d sha1=%s'%(p.split('/')[-1],len(t.split()),hashlib.sha1(t.encode()).hexdigest()[:16]))
