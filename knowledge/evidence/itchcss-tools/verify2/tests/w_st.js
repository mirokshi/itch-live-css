(function(){
const o={}, q=s=>document.querySelector(s);
const fd=q('#wrapper .formatted_description'); const s=document.createElement('div'); s.className='custom-sticky'; s.textContent='S';
const sp=document.createElement('div'); sp.style.height='5000px'; fd.prepend(sp); fd.prepend(s);
o.inner_overflow=getComputedStyle(q('#inner_column')).overflow;
o.tops=[400,1200,2400].map(y=>{scrollTo(0,y);return y+':'+Math.round(s.getBoundingClientRect().top)}).join(' ');
const fi=q('#wrapper .footer .svgicon'); o.footer_svg_fill=fi?getComputedStyle(fi).fill:'MISSING';
const mi=q('#wrapper .more_information_toggle .svgicon'); o.more_info_fill=mi?getComputedStyle(mi).fill:'MISSING';
document.getElementById('out').textContent=JSON.stringify(o);
})();
