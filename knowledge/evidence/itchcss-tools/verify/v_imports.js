(function(){
var o={};
Array.prototype.forEach.call(document.querySelectorAll('style'),function(st,i){var s=st.sheet;var imps=Array.prototype.filter.call(s.cssRules,function(r){return r.type===3}).map(function(r){return r.href.slice(0,60)});o[(st.id||('style'+i))]={rules:s.cssRules.length,imports:imps,src_import_at:st.textContent.indexOf('@import')};});
var h=document.querySelector('.view_jam_page h2, h2'); o.h2_font=h?getComputedStyle(h).fontFamily:null;
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
