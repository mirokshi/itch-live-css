(function(){
var Q=[
 ['#user_tools',['position','top','bottom','z-index','height','background-color','opacity']],
 ['#wrapper',['padding-left','background-color','background-image','color','font-family']],
 ['#inner_column',['width','max-width','font-size','overflow','padding-bottom','background-color','color','font-family','box-shadow']],
 ['#header',['font-size','text-align']],
 ['.columns',['display','flex-direction','margin-top']],
 ['.left_col',['width','order']],
 ['.right_col',['width','order','display']],
 ['.formatted_description',['margin-top','margin-left','margin-bottom','font-size','line-height']],
 ['.formatted_description a',['color']],
 ['.buy_row',['margin-left','font-size']],
 ['.header_buy_row',['display']],
 ['.buy_row .button',['background-color','color','text-shadow','border-radius','font-size','padding']],
 ['#view_game_footer',['position','bottom','font-size','padding-bottom','display']],
 ['#view_game_footer a',['color','opacity']],
 ['.screenshot_list',['white-space','overflow-x']],
 ['.game_info_panel_widget',['background-color']],
 ['h2',['font-size','color','font-weight','margin-top']]
];
var o={vw:innerWidth, mq:{}};
[400,600,650,960,1000,1300,1400].forEach(function(w){o.mq['max'+w]=matchMedia('(max-width:'+w+'px)').matches});
Q.forEach(function(q){var e=document.querySelector(q[0]); if(!e){o[q[0]]='MISSING';return;} var cs=getComputedStyle(e); var r={}; q[1].forEach(function(p){r[p]=cs.getPropertyValue(p).trim()}); o[q[0]]=r;});
var a=document.querySelector('.formatted_description a')||document.querySelector('#inner_column a'); if(a){a.focus(); o.focus={outline:getComputedStyle(a).outlineColor+' '+getComputedStyle(a).outlineStyle};}
document.getElementById('out').textContent=JSON.stringify(o);
})();
