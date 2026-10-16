(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var o={
 wrapper_bg_image:c('#wrapper','background-image').slice(0,50), wrapper_bg_repeat:c('#wrapper','background-repeat'),
 h1s:Array.prototype.map.call(document.querySelectorAll('h1'),function(h){return (h.className||'-')+':'+getComputedStyle(h).display}),
 header_fs:c('#header','font-size'),
 game_text:c('.game_text','color')
};
document.getElementById('out').textContent=JSON.stringify(o);
})();
