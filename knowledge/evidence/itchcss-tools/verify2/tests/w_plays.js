(function(){
const o={vw:innerWidth}, q=s=>document.querySelector(s), g=(s,ps)=>{const e=q(s);if(!e)return 'MISSING';const c=getComputedStyle(e);return ps.map(p=>c.getPropertyValue(p)).join(' | ')};
o.body=g('body',['font-family','font-size','color','background-color']);
o.wrapper=g('#wrapper',['display','position','padding-bottom','min-height','padding-left']);
const f=q('#wrapper > .footer'); o.footer_parent_is_wrapper=!!f; o.footer_in_user_page=!!q('.user_page .footer');
o.footer=g('#wrapper > .footer',['position','bottom','left','right','height','color','font-family','font-size']); o.footer_a=g('#wrapper > .footer a',['color']);
o.user_page=g('.user_page',['font-size','color','font-family']);
o.bio=g('.user_profile',['font-size','line-height']); o.bio_h1=g('.user_profile h1',['font-size','margin']); o.bio_h2=g('.user_profile h2',['font-size','margin']); o.bio_p=g('.user_profile p',['margin','line-height']);
o.name_h1=g('.text_header > h1',['font-size','font-weight','margin','display']);
o.inner=g('.inner_column',['max-width','padding-left','padding-right','width']);
const gw=q('.game_grid_widget'); if(gw){const c=getComputedStyle(gw); o.grid=[c.display,c.gridTemplateColumns.split(' ').length+' cols',c.gridTemplateColumns,gw.clientWidth+'px',c.fontSize,c.alignItems,c.columnGap,c.rowGap].join(' | ');}
o.cell_font=g('.game_cell .game_title',['font-size']);
o.user_tools=g('#user_tools',['position','top','right','opacity','transform','z-index']);
o.columns=g('.user_page .columns',['display']); o.game_column=g('.game_column',['width','margin-left','position','top','overflow-x','display']); o.profile_column=g('.profile_column',['position','width']);
document.getElementById('out').textContent=JSON.stringify(o);
})();
