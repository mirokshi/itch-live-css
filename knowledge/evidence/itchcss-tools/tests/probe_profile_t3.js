(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var o={
 icon_font: c('.game_platform .icon','font-family'),
 text_font: c('.game_title a','font-family'),
 thumb_inline_vs_id: c('.game_cell:nth-child(1) .game_thumb','background-color'),
 thumb_important_vs_inline: c('.game_cell:nth-child(2) .game_thumb','background-color'),
 footer_display: c('.footer','display')
};
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
