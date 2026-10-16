(function(){
var a=document.querySelector('.formatted_description a[rel~=nofollow]');
var o={};
if(a){a.focus(); var af=getComputedStyle(a,'::after'); o.focused_after=af.content+' | bg '+af.backgroundColor+' | pos '+af.position+' | active='+(document.activeElement===a);}
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
