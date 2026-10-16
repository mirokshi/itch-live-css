# usage: python -I theme.py files...  -> per page: title, view classes, jam_theme length, generated/custom split, has bg image, custom css stats
import sys,re,json
sys.stdout.reconfigure(encoding='utf-8')
rows=[]
for f in sys.argv[1:]:
    h=open(f,encoding='utf8').read()
    title=re.search(r'<title>(.*?)</title>',h,re.S); title=title.group(1).strip() if title else ''
    styles=re.findall(r'<style([^>]*)>',h)
    m=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',h,re.S)
    t=m.group(1) if m else None
    gen=cust=None
    if t is not None:
        k=t.find('.jam_filter_picker .divider{')
        if k>=0:
            e=t.find('}',k)+1; gen=t[:e]; cust=t[e:]
    vw=re.search(r'class="(view_jam_page[^"]*|[^"]*view_jam_page[^"]*)"',h)
    wrap=re.search(r'<div[^>]*id="wrapper"[^>]*>',h)
    d=dict(file=f.split('/')[-1],title=title[:50],styles=[s.strip() for s in styles],
           theme_len=len(t) if t is not None else None, gen_len=len(gen) if gen else None,
           custom_len=len(cust.strip()) if cust is not None else None,
           bgimg=('background-image' in gen) if gen else None,
           view=vw.group(1) if vw else None, wrapper=wrap.group(0) if wrap else None,
           footer=('class="footer"' in h), itch_footer=('itch_footer' in h), entries=('id="entries"' in h))
    if cust:
        c=cust.strip()
        d['custom_imports']=re.findall(r'@import[^;]*;',c)
        d['custom_wrapper_rules']=len(re.findall(r'#wrapper',c))
        d['custom_important']=c.count('!important')
        d['custom_crlf']=c.count('\r\n')
        d['custom_comments']=len(re.findall(r'/\*',c))
        d['custom_media']=len(re.findall(r'@media',c))
        d['custom_keyframes']=len(re.findall(r'@keyframes',c))
        d['custom_fontface']=len(re.findall(r'@font-face',c))
        d['custom_bytes']=len(c.encode('utf8'))
    print(json.dumps(d,ensure_ascii=False))
