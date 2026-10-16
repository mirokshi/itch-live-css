(function(){
var w=document.getElementById('wrapper');
var cols=document.querySelector('.columns,.jam_body,.user_page .columns'); if(cols) cols.style.display='none';
var hit=document.elementFromPoint(10,innerHeight-5);
document.getElementById('out').textContent=JSON.stringify({body_bg:getComputedStyle(document.body).backgroundColor,html_bg:getComputedStyle(document.documentElement).backgroundColor,wrapper_bg:getComputedStyle(w).backgroundColor,wrapper_minh:getComputedStyle(w).minHeight,wrapper_h:Math.round(w.getBoundingClientRect().height),vh:innerHeight,hit_below:hit?(hit.id||hit.className||hit.tagName):null});
})();
