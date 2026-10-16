(function(){
const o={vw:innerWidth}, q=s=>document.querySelector(s), g=(s,ps)=>{const e=typeof s==='string'?q(s):s;if(!e)return 'MISSING';const c=getComputedStyle(e);return ps.map(p=>c.getPropertyValue(p).trim()).join(' | ')};
const jb=q('.jam_body'); for(const k of ['a','b']){const d=document.createElement('div');d.className='custom-'+k;d.innerHTML='<div class="game_grid_widget"><div class="game_cell"><div class="game_text">x</div></div></div>';jb.appendChild(d);}
o.game_text_plain=g('.custom-a .game_text',['color']); o.game_text_important=g('.custom-b .game_text',['color']);
const sh=q('#jam_theme').sheet; o.jam_theme_rules=[...sh.cssRules].map(r=>r.constructor.name).reduce((a,n)=>(a[n]=(a[n]||0)+1,a),{});
o.fonts=[...document.fonts].map(f=>f.family).filter(f=>/CustomX/.test(f));
o.user_profile_like=g('.jam_body',['color']);
const ln=q('.jam_body .jam_content a, .jam_body .user_formatted a'); o.content_link=ln?g(ln,['color']):'MISSING';
o.join_btn=g('.join_jam_btn',['background-color','color']);
const hw=q('.header_widget'); o.header_outside_wrapper=!q('#wrapper').contains(hw); o.header_before_wrapper=!!(hw.compareDocumentPosition(q('#wrapper'))&4);
o.header=hw.className+' :: '+g(hw,['height','z-index','background-color','position'])+' :: primary '+g('.header_widget .primary_header',['height','z-index','background-color']);
o.ui_bg=getComputedStyle(document.documentElement).getPropertyValue('--itchio_ui_bg');
o.skip=g('.skip_to_main',['position','top','z-index'])+' href='+(q('.skip_to_main')||{}).getAttribute?.('href')+' target_exists='+!!document.getElementById('maincontent');
o.h1s=[...document.querySelectorAll('h1')].map(h=>h.className+':'+getComputedStyle(h).display);
o.wrapper=g('#wrapper',['min-height','display']); o.body_bg=g('body',['background-color','font-size','font-family']);
o.jam_body=g('.view_jam_page .jam_body',['max-width','margin-top','margin-left','overflow','background-color','border-radius']);
o.title=g('.jam_header_widget .jam_title_header',['font-size','font-weight']);
document.getElementById('out').textContent=JSON.stringify(o);
})();
