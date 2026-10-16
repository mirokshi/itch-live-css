(function(){
var w=getComputedStyle(document.getElementById('wrapper'));
document.getElementById('out').textContent=JSON.stringify({bg_image:w.backgroundImage.slice(0,40),repeat:w.backgroundRepeat,color:w.backgroundColor,body:getComputedStyle(document.body).backgroundColor});
})();
