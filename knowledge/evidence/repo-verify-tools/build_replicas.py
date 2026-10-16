"""Rebuild the two test pages that embed itch.io content (never stored in this repo).

Usage (run with python -I):
  python -I build_replicas.py <raw_dir> <tests_dir>

<raw_dir> must contain a fresh logged-out download of the profile page as profile.html
(curl -sS -A "<browser UA>" --compressed -o profile.html https://<user>.itch.io/).
<tests_dir> must contain itch/user.css (curl https://static.itch.io/user.css?<build>).
Writes <tests_dir>/profile-sim.html (theme + itch CSS, no custom CSS, 4 synthetic cards)
and <tests_dir>/live-replica.html (the live page with scripts removed, user.css pointed at
the local copy and the theme background swapped for a data URI, so it makes no itch requests).
Both expose window.result() for cdp.mjs.
"""
import re
import sys

raw_dir, tests_dir = sys.argv[1], sys.argv[2]
page = open(f"{raw_dir}/profile.html", encoding="utf-8").read()
# itch emits attributes in a different order on each render (seen 2026-10-14:
# <style id="user_theme" type="text/css"> at 12:22, <style type="text/css" id="user_theme"> at 15:05),
# so match the id anywhere inside the tag.
theme = re.search(r'<style[^>]*\sid="user_theme"[^>]*>(.*?)</style>', page, re.S).group(1)
DATA_BG = ('url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 '
           'height=%2710%27%3E%3Crect width=%2710%27 height=%2710%27 fill=%27%23123%27/%3E%3C/svg%3E")')
NO_ITCH_IMG = re.compile(r'url\(https://img\.itch\.zone[^)]*\)')

# ---- profile-sim.html -------------------------------------------------------------------------
theme_local = NO_ITCH_IMG.sub(DATA_BG, theme)
cell = ('<div class="game_cell has_cover lazy_images"><div style="background-color:#000000;" '
        'class="game_thumb"><a class="thumb_link game_link"><img height="250" width="315" '
        'src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27315%27 '
        'height=%27250%27/%3E"></a></div><div class="game_cell_data"><div class="game_title">'
        '<a class="title game_link" href="#">T{n}</a></div><div class="game_text">{txt}</div>'
        '<div class="game_genre">Platformer</div></div></div>')
cells = "".join(cell.replace("{n}", str(i)).replace("{txt}", "long text " * (i * 6)) for i in range(4))
probe_sim = """<script>
const W=()=>document.getElementById('wrapper');
const set=css=>{document.getElementById('custom_css').textContent=css;};
const bg=()=>{const c=getComputedStyle(W());return {img:c.backgroundImage.slice(0,40),repeat:c.backgroundRepeat,pos:c.backgroundPosition,att:c.backgroundAttachment,size:c.backgroundSize};};
const hs=()=>[...document.querySelectorAll('.game_cell')].map(e=>Math.round(e.getBoundingClientRect().height));
window.result=()=>{const r={};set('');r.theme_only=bg();r.grid_align=getComputedStyle(document.querySelector('.game_grid_widget')).alignItems;r.cells_default=hs();
r.nested_title_color=getComputedStyle(document.querySelector('.game_title a.title')).color;
set('#wrapper{background:#123}');r.shorthand=bg();
set('#wrapper{background-repeat:no-repeat;background-size:cover;background-position:center;background-attachment:fixed}');r.longhands=bg();
set('#wrapper .game_grid_widget{grid-auto-rows:1fr}');r.cells_autorows_only=hs();
set('#wrapper .game_grid_widget{grid-auto-rows:1fr;align-items:stretch}');r.cells_stretch=hs();
const t=document.querySelector('.game_thumb'),i=t.querySelector('img');
set('#wrapper .game_thumb{aspect-ratio:63/50}#wrapper .game_thumb img{width:100%;height:100%;object-fit:cover}');
r.thumb_noImportant={thumbW:t.getBoundingClientRect().width,imgW:i.getBoundingClientRect().width,imgH:i.getBoundingClientRect().height};
set('#wrapper .game_thumb{background-color:red}');r.thumbBg_noImportant=getComputedStyle(t).backgroundColor;
set('#wrapper .game_thumb{background-color:red!important}');r.thumbBg_important=getComputedStyle(t).backgroundColor;
set('#wrapper .user_page{--itchio_link_color:rgb(255, 0, 0)}');r.title_after_var_override=getComputedStyle(document.querySelector('.game_title a.title')).color;
set('#wrapper .game_title a{color:rgb(255, 0, 0)}');r.title_after_selector_override=getComputedStyle(document.querySelector('.game_title a.title')).color;
set('');return r;};
</script>"""
sim = (f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="itch/user.css">'
       f'<style id="user_theme">{theme_local}</style><style id="custom_css"></style></head><body>'
       f'<div class="user_page_wrap" id="wrapper"><div class="user_page page_widget base_widget mode_grid">'
       f'<div class="inner_column profile_content"><div class="columns"><div class="column game_column">'
       f'<div class="game_grid_widget base_widget user_game_grid">{cells}</div></div></div></div></div>'
       f'<div class="footer"><div class="footer_inner"><a href="#">itch.io</a></div></div></div>'
       f'{probe_sim}</body></html>')
open(f"{tests_dir}/profile-sim.html", "w", encoding="utf-8").write(sim)

# ---- live-replica.html ------------------------------------------------------------------------
h = re.sub(r"<script\b.*?</script>", "", page, flags=re.S)
h = re.sub(r'https://static\.itch\.io/user\.css\?\d+', "itch/user.css", h)
h = NO_ITCH_IMG.sub(DATA_BG, h)
h = re.sub(r'<meta [^>]*twitter:image[^>]*>', "", h)
probe_live = """<script>
window.result=async()=>{await new Promise(r=>setTimeout(r,2500));const r={};
const W=document.getElementById('wrapper'),box=document.getElementById('custom_css').sheet;
r.importRules=[...box.cssRules].filter(x=>x instanceof CSSImportRule).map(x=>({href:x.href.slice(0,60),loaded:!!x.styleSheet,readable:(()=>{try{return x.styleSheet.cssRules.length}catch(e){return 'blocked:'+e.name}})()}));
const hello=document.querySelector('.custom-hello');if(hello){r.helloDisplay=getComputedStyle(hello).display;r.helloColor=getComputedStyle(hello).color;}
r.wrapperBeforeBg=getComputedStyle(W,'::before').backgroundImage.slice(0,30);
await document.fonts.ready;r.fontsLoaded=[...new Set([...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family))];
const f=document.querySelector('.footer'),top1=f.getBoundingClientRect().top+scrollY;
const idx=[...box.cssRules].findIndex(x=>x.selectorText==='#wrapper .footer');
if(idx>=0){const saved=box.cssRules[idx].cssText;box.deleteRule(idx);r.footerTop_with=top1;r.footerTop_without=f.getBoundingClientRect().top+scrollY;box.insertRule(saved,idx);}
const up=document.querySelector('.user_page'),n=box.cssRules.length;
box.insertRule('#wrapper{--itchio_link_color:red}',n);r.var_on_wrapper=getComputedStyle(up).getPropertyValue('--itchio_link_color');box.deleteRule(n);
box.insertRule('#wrapper .user_page{--itchio_link_color:red}',n);r.var_on_user_page=getComputedStyle(up).getPropertyValue('--itchio_link_color');box.deleteRule(n);
r.cellHeights=[...document.querySelectorAll('.game_cell')].map(e=>Math.round(e.getBoundingClientRect().height));
r.visibleHeadings=[...document.querySelectorAll('h1,h2,h3')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.tagName+'.'+e.className);
return r;};
</script>"""
h = h.replace("</body>", probe_live + "</body>")
open(f"{tests_dir}/live-replica.html", "w", encoding="utf-8").write(h)
print("wrote profile-sim.html and live-replica.html")
