(function(){
document.querySelector('.user_profile').insertAdjacentHTML('beforeend','<div class="custom-cover"></div>');
var b=document.querySelector('#user_tools .action_btn'); var r=b.getBoundingClientRect();
var hit=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
document.getElementById('out').textContent=JSON.stringify({btn_rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)], hit:hit?(hit.className||hit.tagName):null, wrapper_z:getComputedStyle(document.getElementById('wrapper')).zIndex});
})();
