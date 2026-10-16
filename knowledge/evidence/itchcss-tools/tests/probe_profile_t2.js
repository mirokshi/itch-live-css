(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var o={
 T5_bg_shorthand_wipes_theme_image: c('#wrapper','background-image')+' | repeat='+c('#wrapper','background-repeat')+' | attach='+c('#wrapper','background-attachment')+' | color='+c('#wrapper','background-color'),
 T9b_import_after_rule_ignored: c('.user_links','outline-color'),
 sheet_rules: (function(){var s=document.getElementById('custom_css').sheet; return Array.prototype.map.call(s.cssRules,function(r){return r.cssText.slice(0,60)});})()
};
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
