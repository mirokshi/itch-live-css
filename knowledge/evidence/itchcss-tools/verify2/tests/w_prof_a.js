(function(){
const o={}, q=s=>document.querySelector(s), cs=(s,p)=>{const e=q(s);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING'};
o.title_a=cs('#wrapper .game_cell .game_title a','color');
o.game_text=cs('#wrapper .game_cell .game_text','color');
o.game_genre=cs('#wrapper .game_cell .game_genre','color');
o.game_platform_imported=cs('#wrapper .game_cell .game_platform','color');
o.user_profile=cs('#wrapper .user_profile','color');
o.var_link_on_user_page=cs('.user_page','--itchio_link_color');
o.var_link_on_wrapper=cs('#wrapper','--itchio_link_color');
o.var_gray_on_user_page=cs('.user_page','--itchio_gray_back');
const g=q('.game_grid_widget'); o.grid_gap=g?getComputedStyle(g).columnGap+' / '+getComputedStyle(g).rowGap:'MISSING';
o.thumb_bg_inline=cs('.game_thumb','background-color');
const sh=q('#custom_css').sheet; o.custom_rules=[...sh.cssRules].map(r=>r.constructor.name).join(',');
try{o.import_loaded=sh.cssRules[0].styleSheet?sh.cssRules[0].styleSheet.cssRules.length:'null'}catch(e){o.import_loaded='ERR '+e.name}
const a=q('#wrapper .user_profile a')||q('#wrapper a'); a.focus(); const st=getComputedStyle(a);
o.focus_el=a.className||a.getAttribute('href'); o.focus_matches=a.matches(':focus'); o.focus_outline=st.outlineColor+' '+st.outlineStyle+' '+st.outlineWidth;
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
