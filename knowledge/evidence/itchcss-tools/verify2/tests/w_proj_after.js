(function(){const nf=document.querySelector('#wrapper .formatted_description a[rel~=nofollow]');nf.focus();const a=getComputedStyle(nf,'::after');
document.getElementById('out').textContent=JSON.stringify({rel:nf.getAttribute('rel'),after:[a.content,a.backgroundColor,a.color,a.position].join(' | ')});})();
