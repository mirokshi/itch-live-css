(function(){
var Q=[
 ['body',['font-family','font-size','color','background-color','margin']],
 ['#user_tools',['position','z-index','top','right','opacity','display']],
 ['#wrapper',['display','position','padding-bottom','background-image','background-repeat','background-attachment','background-position','color','min-height']],
 ['.user_page',['font-family','color','font-size','--itchio_link_color','--itchio_font_family','--itchio_border_radius','--itchio_gray_back','--itchio_input_focus_color']],
 ['#profile_header',['margin-bottom']],
 ['.text_header>h1',['font-size','margin','display','font-weight']],
 ['.profile_content',['max-width','padding-left','padding-right','margin-left','margin-bottom']],
 ['.user_profile',['font-size','line-height']],
 ['.user_profile h1',['font-size','margin']],
 ['.user_profile h2',['font-size','margin']],
 ['.game_grid_widget',['display','grid-template-columns','column-gap','row-gap','align-items','font-size']],
 ['.game_cell',['width','min-width']],
 ['.game_title a.title',['color','font-weight','text-decoration-line']],
 ['.game_text',['color','white-space']],
 ['.footer',['position','bottom','left','right','border-top-width','border-top-style','border-top-color','font-size']],
 ['.footer .footer_inner',['max-width','padding']],
 ['.footer a',['color']],
 ['.user_links',['display','margin-bottom']]
];
var o={vw:innerWidth};
Q.forEach(function(q){var e=document.querySelector(q[0]); if(!e){o[q[0]]='MISSING';return;} var cs=getComputedStyle(e); var r={}; q[1].forEach(function(p){r[p]=cs.getPropertyValue(p).trim()}); o[q[0]]=r;});
var a=document.querySelector('.user_profile a, .footer a'); a.focus(); var cs=getComputedStyle(a); o.focus={el:a.className||a.tagName, active:document.activeElement===a, 'outline-color':cs.outlineColor,'outline-style':cs.outlineStyle,'outline-width':cs.outlineWidth};
o.user_tools_inside_wrapper=document.getElementById('wrapper').contains(document.getElementById('user_tools'));
o.footer_inside_wrapper=document.getElementById('wrapper').contains(document.querySelector('.footer'));
o.footer_parent=document.querySelector('.footer').parentElement.id||document.querySelector('.footer').parentElement.className;
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
