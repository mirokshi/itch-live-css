# Per-page feature table. usage: python -I analyze.py "raw/[pc]-*.html" out.json
import sys,re,json,glob,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from skelmod import P
def walk(n):
    yield n
    for k in n.c: yield from walk(k)
def cls(n): return (n.a.get('class') or '').split()
KEYS=['embed_wrapper','game_frame','iframe_placeholder','load_iframe_btn','game_loading','embed_info','header','has_image','columns','left_col','right_col','formatted_description','user_formatted','more_information_toggle','info_panel_wrapper','game_info_panel_widget','buy_row','header_buy_row','purchase_banner','donate_btn','buy_btn','download_btn','uploads','upload_list_widget','upload','screenshot_list','video_embed','game_devlog','community_summary','game_comments_widget','game_community_preview_widget','jam_entry','rewards','reward_row','bundle_row','footer','related_games','sale_banner','game_title','button_message','buy_message','star_value','aggregate_rating']
rows=[]
for f in sorted(glob.glob(sys.argv[1])):
    t=open(f,encoding='utf-8').read()
    if len(t)<3000: continue
    p=P(); p.feed(t)
    allc={}
    ids=[]
    body=None;wrap=None;inner=None;hdr=None;vgp=None;frames=[]
    for n in walk(p.root):
        for c in cls(n): allc[c]=allc.get(c,0)+1
        if n.a.get('id'): ids.append(n.a['id'])
        if n.tag=='body': body=n
        if n.a.get('id')=='wrapper': wrap=n
        if n.a.get('id')=='inner_column': inner=n
        if n.a.get('id')=='header': hdr=n
        if 'view_game_page' in cls(n): vgp=n
        if n.tag=='iframe': frames.append({k:v for k,v in n.a.items() if k!='src'} | {'src_host':re.sub(r'^(https?:)?//([^/]+).*',r'\2',n.a.get('src',''))})
    m=re.search(r'<style[^>]*id="custom_css"[^>]*>(.*?)</style>',t,re.S)
    th=re.search(r'<style id="(\w+)"[^>]*>(.*?)</style>',t,re.S)
    heads=re.findall(r'<(?:style|link)[^>]*?(?:id="(\w+)"|href="([^"]+\.css[^"]*)"|href="(https://fonts[^"]+)")',t[:t.find('</head>')])
    rows.append(dict(f=os.path.basename(f),body=cls(body) if body else None,wrapper=cls(wrap) if wrap else None,inner=cls(inner) if inner else None,header=cls(hdr) if hdr else None,vgp=cls(vgp) if vgp else None,
        custom_css=len(m.group(1)) if m else None, first_style_id=th.group(1) if th else None,
        keys={k:allc.get(k,0) for k in KEYS}, frames=frames, ids=[i for i in ids if not re.search(r'\d{3,}',i)]))
json.dump(rows,open(sys.argv[2],'w'),indent=1)
for r in rows:
    print(r['f'], 'css=',r['custom_css'],'| wrap',r['wrapper'],'| inner',r['inner'],'| hdr',r['header'],'| vgp',r['vgp'])
