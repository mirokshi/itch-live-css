(function(){
var o={};
Array.prototype.forEach.call(document.querySelectorAll('style'),function(st,i){var s=st.sheet;var n=s.cssRules.length;var imps=Array.prototype.filter.call(s.cssRules,function(r){return r.type===3}).map(function(r){return r.href});o[(st.id||('style'+i))]={rules:n,imports:imps,src_has_import:st.textContent.indexOf('@import')};});
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
