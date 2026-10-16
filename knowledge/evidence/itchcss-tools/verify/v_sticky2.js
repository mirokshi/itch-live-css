(function(){
var d=document.querySelector('.formatted_description'); d.insertAdjacentHTML('afterbegin','<div class="custom-sticky">S</div>');
d.style.minHeight='5000px';
var s=document.querySelector('.custom-sticky'); var res={overflow:getComputedStyle(document.getElementById('inner_column')).overflow};
[0,400,800,1600].forEach(function(y){window.scrollTo(0,y); res['y'+y]=Math.round(s.getBoundingClientRect().top)+' (parent bottom '+Math.round(d.getBoundingClientRect().bottom)+')';});
document.getElementById('out').textContent=JSON.stringify(res);
})();
