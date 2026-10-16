# usage: python -I sel.py raw/ov_*.html  -> classifies selectors of the host custom CSS
import re,sys,collections
sys.stdout.reconfigure(encoding='utf-8')
tot=collections.Counter(); per={}
atr=collections.Counter(); sizes={}
for f in sys.argv[1:]:
    h=open(f,encoding='utf8').read()
    m=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',h,re.S)
    if not m: continue
    t=m.group(1); k=t.rfind('.jam_filter_picker .divider{'); c=t[t.find('}',k)+1:].strip()
    if not c: continue
    name=f.split('/')[-1]; sizes[name]=(len(c),c.count('/*'),c.count('\n')+1,c.count('!important'), len(re.findall(r'&(?:gt|lt|amp|quot|#\d+);',c)), c.count('>'))
    c2=re.sub(r'/\*.*?\*/','',c,flags=re.S)
    for a in re.findall(r'@([a-z-]+)',c2): atr[a]+=1
    # collect selectors: remove @import lines, keyframes bodies
    c2=re.sub(r'@import[^;]*;','',c2)
    c2=re.sub(r'@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}','',c2)
    sels=[]
    for pre in re.findall(r'([^{}]+)\{',c2):
        pre=pre.strip()
        if pre.startswith('@'): continue
        sels+= [s.strip() for s in pre.split(',') if s.strip()]
    cnt=collections.Counter()
    for s in sels:
        first=re.split(r'[\s>+~]',s)[0]
        if first.startswith('#wrapper'): k='#wrapper'
        elif re.match(r'^(html|body|:root)\b',first): k='html/body/:root'
        elif s.startswith('.header_widget') or '.user_panel_widget' in s or 'primary_header' in s: k='site header'
        elif first.startswith('.custom-') or first.startswith('.custom_'): k='custom'
        elif first.startswith('.view_jam_page') or first.startswith('.jam_page_wrap'): k='view_jam_page/jam_page_wrap'
        elif first.startswith('.') or first.startswith('#') or first.startswith('['): k='other class'
        elif first.startswith(':') or first.startswith('*'): k='universal/pseudo'
        else: k='bare element'
        cnt[k]+=1
    per[name]=dict(cnt); tot.update(cnt)
for k,v in per.items(): print(k[:32].ljust(32),sizes[k],v)
print('TOTAL',sum(tot.values()),dict(tot)); print('at-rules',dict(atr))
