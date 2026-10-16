(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var o={
 P1_var_button_color_on_wrapper: c('#wrapper','--itchio_button_color')+' -> .buy_btn bg '+c('.buy_row .button','background-color'),
 P2_var_link_color: c('.formatted_description','--itchio_link_color')+' -> a '+c('.formatted_description a','color'),
 P3_bg_shorthand_project: c('#wrapper','background-image')+' '+c('#wrapper','background-color'),
 P4_equal_spec_custom_after_theme_h2: c('#inner_column h2','color'),
};
var b=document.querySelector('.buy_row .button'); b.focus(); o.P5_button_focus=getComputedStyle(b).outlineColor+' '+getComputedStyle(b).outlineStyle+' active='+(document.activeElement===b);
var a=document.querySelector('.formatted_description a'); a.focus(); o.P6_link_focus=getComputedStyle(a).outlineColor;
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
