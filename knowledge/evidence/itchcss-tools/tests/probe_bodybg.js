(function(){
var w=document.getElementById('wrapper');
var cols=document.querySelector('.columns,.jam_body,.columns'); if(cols) cols.style.display='none';
var o={body_bg:getComputedStyle(document.body).backgroundColor, html_bg:getComputedStyle(document.documentElement).backgroundColor, wrapper_minh:getComputedStyle(w).minHeight, wrapper_h_when_short:Math.round(w.getBoundingClientRect().height), vh:innerHeight, hit_below:(function(){var e=document.elementFromPoint(10,innerHeight-5);return e?(e.id||e.className||e.tagName):null})()};
document.getElementById('out').textContent=JSON.stringify(o);
})();
