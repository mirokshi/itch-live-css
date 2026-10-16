(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var s=document.getElementById('custom_css').sheet;
document.getElementById('out').textContent=JSON.stringify({
 bg:[c('#wrapper','background-image'),c('#wrapper','background-repeat'),c('#wrapper','background-attachment'),c('#wrapper','background-position'),c('#wrapper','background-color')],
 outline_after_rule_import:c('.user_links','outline-color'),
 rules:Array.prototype.map.call(s.cssRules,function(r){return r.type+':'+r.cssText.slice(0,50)})},null,1);
})();
