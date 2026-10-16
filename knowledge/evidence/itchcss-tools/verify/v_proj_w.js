(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var ut=document.getElementById('user_tools'), w=document.getElementById('wrapper');
var o={vw:innerWidth,
 ut:[c('#user_tools','position'),c('#user_tools','top'),c('#user_tools','bottom'),c('#user_tools','z-index'),c('#user_tools','height'),c('#user_tools','background-color'),c('#user_tools','opacity')].join(' | '),
 ut_before_wrapper: ut? !!(ut.compareDocumentPosition(w)&Node.DOCUMENT_POSITION_FOLLOWING):null, ut_in_wrapper:w.contains(ut),
 wrap:[c('#wrapper','padding-left'),c('#wrapper','min-height'),c('#wrapper','background-color'),c('#wrapper','isolation'),c('#wrapper','z-index'),c('#wrapper','position')].join(' | '),
 inner:[c('#inner_column','width'),c('#inner_column','max-width'),c('#inner_column','font-size'),c('#inner_column','overflow'),c('#inner_column','padding-bottom'),c('#inner_column','position'),c('#inner_column','background-color'),c('#inner_column','font-family')].join(' | '),
 inner_cls:document.getElementById('inner_column').className,
 columns:[c('.columns','display'),c('.columns','flex-direction')].join(' | '),
 left:[c('.left_col','width'),c('.left_col','order')].join(' | '), right:[c('.right_col','width'),c('.right_col','order')].join(' | '),
 footer:[c('#view_game_footer','position'),c('#view_game_footer','bottom'),c('#view_game_footer','padding-bottom'),c('#view_game_footer','font-family'),c('#view_game_footer','font-size')].join(' | '),
 footer_parent:(document.getElementById('view_game_footer')||{}).parentElement?document.getElementById('view_game_footer').parentElement.id:null,
 shots:[c('.screenshot_list','white-space'),c('.screenshot_list','overflow-x')].join(' | '),
 body:[c('body','background-color'),c('body','font-family'),c('body','font-size')].join(' | '),
 header:[c('#header','font-size')].join(' | '), header_cls:(document.getElementById('header')||{}).className,
 h1s:Array.prototype.map.call(document.querySelectorAll('h1'),function(h){return h.className+':'+getComputedStyle(h).display+':'+h.textContent.trim().slice(0,20)}),
 banner_alt:(document.querySelector('#header img')||{}).alt,
 skip:!!document.querySelector('.skip_to_main'), header_widget:!!document.querySelector('.header_widget'),
 body_children:Array.prototype.slice.call(document.body.children,0,5).map(function(e){return e.tagName+'#'+e.id+'.'+e.className.slice(0,40)}),
 scrollW:document.documentElement.scrollWidth
};
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
