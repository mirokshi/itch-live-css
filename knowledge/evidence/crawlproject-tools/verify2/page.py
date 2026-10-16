import sys, os, re, hashlib, glob, json
sys.path.insert(0, os.path.dirname(__file__))
from tree import load, byid, bycls, chain, kids
def sk(n): return n.sig() if n is not None else None
def short(s):
    # drop numeric widget ids for comparison
    return re.sub(r'#([a-z_]+?)_\d+', r'#\1_N', s)
res={}
for path in sys.argv[1:]:
    name=os.path.basename(path).rsplit('.',1)[0]
    r=load(path); d={}
    body=r.find(lambda n:n.tag=='body')
    if not body: d['err']='nobody'; res[name]=d; continue
    body=body[0]
    d['body_cls']=sorted(body.cls); d['page_name']=body.a.get('data-page_name')
    d['body_kids']=[short(k.sig()) for k in kids(body,('script','noscript'))]
    head=r.find(lambda n:n.tag=='head')[0]
    hk=[]
    for k in head.kids:
        if k.tag=='link' and 'stylesheet' in k.a.get('rel',''): hk.append('link:'+re.sub(r'\?.*','',k.a.get('href',''))[:60])
        elif k.tag=='style': hk.append('style#'+str(k.id))
        elif k.tag=='script': hk.append('script')
    d['head']=hk; d['head_last']=sk(kids(head,())[-1]) if kids(head,()) else None
    cc=byid(r,'custom_css'); gt=byid(r,'game_theme')
    d['custom_css_len']=len(cc.text) if cc else None
    d['custom_css_md5']=hashlib.md5(cc.text.encode()).hexdigest()[:10] if cc else None
    d['game_theme_md5']=hashlib.md5(gt.text.encode()).hexdigest()[:10] if gt else None
    w=byid(r,'wrapper')
    if w:
        d['wrapper']=w.sig(); d['wrapper_parent']=w.up.tag
        ic=byid(r,'inner_column'); d['inner']=sk(ic); d['inner_parent']=sk(ic.up) if ic else None
        d['inner_kids']=[short(k.sig()) for k in kids(ic)] if ic else None
        d['wrapper_kids']=[short(k.sig()) for k in kids(w)]
        h=byid(r,'header'); d['header']=sk(h); d['header_kids']=[k.sig() for k in kids(h)] if h else None
        if h:
            d['header_deep']=[ (k.sig(), [kk.sig() for kk in k.kids]) for k in kids(h)]
            imgs=[n for n in h.walk() if n.tag=='img']; d['header_img_alt']=[('alt' in i.a, bool(i.a.get('alt'))) for i in imgs]
        pw=[k for k in kids(ic) if 'page_widget' in k.cls] if ic else []
        if pw:
            pw=pw[0]; d['pw']=short(pw.sig()); d['pw_kids']=[short(k.sig()) for k in kids(pw)]
        lc=bycls(r,'left_col'); rc=bycls(r,'right_col')
        d['left']=[short(k.sig()) for k in kids(lc[0])] if lc else None
        d['right']=[short(k.sig()) for k in kids(rc[0])] if rc else None
        d['n_left']=len(lc); d['n_right']=len(rc)
        sc=[n for n in r.walk() if n.tag=='img' and 'screenshot' in n.cls]
        d['shots']=len(sc); d['shots_alt']=sum(1 for n in sc if n.a.get('alt'))
        d['shot_attrs']=sorted(set(k for n in sc for k in n.a))
        gf=bycls(r,'game_frame')
        if gf:
            g=gf[0]; d['game_frame']=g.sig(); d['gf_style']=g.a.get('style'); d['gf_data']=(g.a.get('data-width'),g.a.get('data-height'))
            d['gf_kids']=[k.sig() for k in kids(g)]
            d['gf_deep']=[(k.sig(),[kk.sig() for kk in k.kids]) for k in kids(g)]
            ph=bycls(r,'iframe_placeholder'); d['ph_data_iframe']=bool(ph and ph[0].a.get('data-iframe'))
        ifr=[n for n in r.walk() if n.tag=='iframe']
        d['iframes']=[{k:(v if k in('src','allow','id','frameborder','allowtransparency','sandbox','style') else '') for k,v in i.a.items()} for i in ifr]
        d['fd_count']=len(bycls(r,'formatted_description'))
        d['fd_chains']=[chain(n.up)[:120] for n in bycls(r,'formatted_description')]
        d['uf_parents']=sorted(set(short(n.up.sig()) if n.up else '' for n in bycls(r,'user_formatted')))
        ids=[n.id for n in r.walk() if n.id]
        d['ids']=ids
        d['in_wrapper_ids']=[n.id for n in w.walk() if n.id]
    res[name]=d
json.dump(res,sys.stdout,indent=1)
