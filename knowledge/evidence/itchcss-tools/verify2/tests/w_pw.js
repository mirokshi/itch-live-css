(function(){
const o={vw:innerWidth}, q=s=>document.querySelector(s), g=(s,ps)=>{const e=typeof s==='string'?q(s):s;if(!e)return 'MISSING';const c=getComputedStyle(e);return ps.map(p=>c.getPropertyValue(p).trim()).join(' | ')};
o.ut=g('#user_tools',['position','top','bottom','height','z-index','opacity','background-color']); o.ut_before_wrapper=!q('#wrapper').contains(q('#user_tools'));
o.wrap=g('#wrapper',['padding-left','min-height']);
o.inner=g('#inner_column',['width','max-width','font-size','overflow','padding-bottom','position','background-color']); o.inner_cls=q('#inner_column').className;
o.cols=g('.view_game_page .columns',['display','flex-direction']); o.left=g('.left_col',['order','width']); o.right=g('.right_col',['order','width']);
o.footer=g('#view_game_footer',['position','padding-bottom','font-family','font-size']); o.footer_in_inner=q('#inner_column').contains(q('#view_game_footer'));
o.shots=g('.screenshot_list',['white-space','overflow-x','display']);
o.body=g('body',['background-color','font-family','font-size']);
document.getElementById('out').textContent=JSON.stringify(o);
})();
