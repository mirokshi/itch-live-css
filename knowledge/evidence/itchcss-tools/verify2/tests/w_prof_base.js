(function(){
const o={}, q=s=>document.querySelector(s);
const w=getComputedStyle(q('#wrapper')); o.bg=[w.backgroundColor,w.backgroundImage.slice(0,40),w.backgroundRepeat,w.backgroundAttachment,w.backgroundPosition,w.backgroundSize].join(' | ');
const d=document.createElement('div'); d.style.animation='spin 1s linear infinite'; q('#wrapper').appendChild(d);
const a=d.getAnimations(); o.spin_builtin=a.length?JSON.stringify(a[0].effect.getKeyframes().map(k=>k.transform||k.opacity)):'no anim';
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
