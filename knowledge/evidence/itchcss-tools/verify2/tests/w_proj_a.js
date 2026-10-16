(function(){
const o={}, q=s=>document.querySelector(s), g=(e,ps)=>{if(!e)return 'MISSING';const c=getComputedStyle(e);return ps.map(p=>c.getPropertyValue(p).trim()).join(' | ')};
const w=q('#wrapper'); o.wrapper_classes=w.className; o.wrapper_vars=g(w,['--itchio_link_color','--itchio_button_color']);
o.wrapper_bg=g(w,['background-color','background-image','background-repeat']);
const b=q('#wrapper .buy_btn')||q('#wrapper .button'); o.btn=b.className+' -> '+g(b,['background-color','color']);
const da=q('#wrapper .formatted_description a'); o.desc_link=da?da.getAttribute('rel')+' -> '+g(da,['color']):'MISSING';
b.focus(); o.btn_focus=b.matches(':focus')+' '+g(b,['outline-color','outline-style']);
const nf=q('#wrapper .user_formatted a[rel~=nofollow]'); if(nf){nf.focus(); o.nofollow_focus=g(nf,['outline-color']); const a=getComputedStyle(nf,'::after'); o.badge=[a.content,a.backgroundColor,a.color,a.position,a.zIndex].join(' | ');}
o.h1=g(q('#header h1'),['display']); o.header_cls=q('#header').className; const im=q('#header img'); o.banner_alt=im?im.getAttribute('alt'):null;
o.h1_count_visible=[...document.querySelectorAll('h1')].filter(h=>getComputedStyle(h).display!=='none').length;
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
