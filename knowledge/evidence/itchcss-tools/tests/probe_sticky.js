(function(){
var d=document.querySelector('.formatted_description'); d.insertAdjacentHTML('afterbegin','<div class="custom-sticky"></div>');
document.querySelector('.left_col').style.minHeight='5000px';
var s=document.querySelector('.custom-sticky'); var before=s.getBoundingClientRect().top;
window.scrollTo(0,800); var after=s.getBoundingClientRect().top;
document.getElementById('out').textContent=JSON.stringify({overflow:getComputedStyle(document.getElementById('inner_column')).overflow,top_before:Math.round(before),top_after_scroll800:Math.round(after),scrollY:scrollY});
})();
