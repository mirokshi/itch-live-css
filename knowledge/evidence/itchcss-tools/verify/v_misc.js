(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var up=document.querySelector('.user_profile');
up.insertAdjacentHTML('beforeend','<div id="kf" style="animation:spin 1s infinite"></div><div class="custom-cover"></div>');
var a=document.getElementById('kf').getAnimations()[0];
var icon=document.querySelector('[class^="icon-"],[class*=" icon-"]');
var b=document.querySelector('#user_tools .action_btn')||document.querySelector('#user_tools a'); var r=b.getBoundingClientRect();
var hit=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
var o={
 kf_name:a&&a.animationName, kf:a&&a.effect.getKeyframes().map(function(k){return [k.offset,k.opacity,k.transform].join('/')}),
 icon_cls:icon?icon.className:null, icon_font:icon?getComputedStyle(icon).fontFamily:null, text_font:c('.user_profile','font-family'),
 thumb1:c('.game_cell:nth-child(1) .game_thumb','background-color'), thumb2:c('.game_cell:nth-child(2) .game_thumb','background-color'),
 btn:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)], hit:hit?(hit.className||hit.tagName):null,
 wrapper_z:c('#wrapper','z-index'), wrapper_iso:c('#wrapper','isolation'), wrapper_pos:c('#wrapper','position')
};
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
