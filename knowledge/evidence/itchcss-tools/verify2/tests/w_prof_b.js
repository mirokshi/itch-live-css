(function(){
const o={}, q=s=>document.querySelector(s);
const sh=q('#custom_css').sheet; o.custom_rules=[...sh.cssRules].map(r=>r.constructor.name).join(',');
o.user_profile=getComputedStyle(q('#wrapper .user_profile')).color;
const w=getComputedStyle(q('#wrapper')); o.bg=[w.backgroundColor,w.backgroundImage.slice(0,40),w.backgroundRepeat,w.backgroundAttachment,w.backgroundPosition,w.backgroundSize].join(' | ');
const d=document.createElement('div'); d.style.animation='spin 1s linear infinite'; q('#wrapper').appendChild(d);
const d2=document.createElement('div'); d2.style.animation='spin 1s linear infinite'; document.body.insertBefore(d2,document.body.firstChild);
const kf=el=>{const a=el.getAnimations(); return a.length?JSON.stringify(a[0].effect.getKeyframes().map(k=>{const c={...k};delete c.computedOffset;delete c.easing;delete c.composite;return c})):'no anim'};
o.spin_inside=kf(d); o.spin_outside_wrapper=kf(d2);
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
