(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var o={vw:innerWidth, ut:[c('#user_tools','position'),c('#user_tools','opacity'),c('#user_tools','bottom')].join(' '), grid:c('.game_grid_widget','grid-template-columns'), gfs:c('.game_grid_widget','font-size'), inner:c('.profile_content','width'), cols:c('.columns','display'), h1:c('.text_header>h1','font-size'), scrollW:document.documentElement.scrollWidth};
document.getElementById('out').textContent=JSON.stringify(o);
})();
