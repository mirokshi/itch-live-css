(function(){
const o={}, q=s=>document.querySelector(s);
const ut=q('#user_tools'); const b=ut.querySelector('a,button'); const r=b.getBoundingClientRect();
const hit=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
o.btn=b.className; o.rect=[r.left|0,r.top|0,r.width|0,r.height|0].join(',');
const cs=getComputedStyle(ut); o.user_tools=[cs.position,cs.zIndex,cs.opacity,cs.pointerEvents,cs.visibility,cs.transform].join(' | ');
o.ut_before_wrapper=!!(ut.compareDocumentPosition(q('#wrapper'))&Node.DOCUMENT_POSITION_FOLLOWING); o.ut_inside_wrapper=q('#wrapper').contains(ut);
o.hit_is_user_tools=ut.contains(hit); o.hit=hit?hit.tagName+'#'+hit.id+'.'+hit.className:null;
const w=getComputedStyle(q('#wrapper')); o.wrapper=[w.position,w.zIndex,w.isolation].join(' | ');
o.mode=q('.user_page').className;
document.getElementById('out').textContent=JSON.stringify(o);
})();
