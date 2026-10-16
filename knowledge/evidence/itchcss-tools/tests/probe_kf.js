(function(){
document.querySelector('.user_profile').insertAdjacentHTML('beforeend','<div id="kf" style="animation:spin 1s infinite"></div>');
var a=document.getElementById('kf').getAnimations()[0];
document.getElementById('out').textContent=JSON.stringify({name:a&&a.animationName,keyframes:a&&a.effect.getKeyframes().map(function(k){return {o:k.offset,opacity:k.opacity,transform:k.transform}})});
})();
