(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var btn=document.querySelector('.buy_row .button')||document.querySelector('#inner_column .button');
var a=document.querySelector('.formatted_description a');
var o={
 var_btn_on_wrapper:c('#wrapper','--itchio_button_color'),
 btn_cls:btn?btn.className:null, btn_bg:btn?getComputedStyle(btn).backgroundColor:null, btn_color:btn?getComputedStyle(btn).color:null,
 var_link:c('.formatted_description','--itchio_link_color'), a_color:a?getComputedStyle(a).color:null, a_rel:a?a.getAttribute('rel'):null,
 bg:[c('#wrapper','background-image'),c('#wrapper','background-color')].join(' | ')
};
if(btn){btn.focus(); o.btn_focus=getComputedStyle(btn).outlineColor+' '+getComputedStyle(btn).outlineStyle+' active='+(document.activeElement===btn);}
if(a){a.focus(); o.a_focus=getComputedStyle(a).outlineColor+' '+getComputedStyle(a).outlineStyle;
 var af=getComputedStyle(a,'::after'); o.a_after_focus=af.content+' | '+af.backgroundColor+' | '+af.color;}
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
