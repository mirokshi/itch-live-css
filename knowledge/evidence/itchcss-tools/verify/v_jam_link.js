(function(){
var host=document.querySelector('.jam_content')||document.querySelector('.jam_body');
host.insertAdjacentHTML('afterbegin','<p><a href="#z" id="probeA">probe</a></p>');
var a=document.getElementById('probeA');
var links=Array.prototype.slice.call(document.querySelectorAll('#wrapper a')).slice(0,6).map(function(x){return (x.className||'-')+':'+getComputedStyle(x).color+':'+(x.closest('[class]')||{}).className});
document.getElementById('out').textContent=JSON.stringify({host:host.className,probe_color:getComputedStyle(a).color,var_on_wrapper:getComputedStyle(document.getElementById('wrapper')).getPropertyValue('--itchio_link_color'),first_links:links},null,1);
})();
