(function(){
const o={}, q=s=>document.querySelector(s), cs=(s,p)=>{const e=q(s);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING'};
o.coll_h2_a=cs('#wrapper .collection_row h2 a','color'); o.coll_h2=cs('#wrapper .collection_row h2','color');
o.purch_h2_a=cs('#wrapper .purchased_games h2 a','color');
const ic=q('#wrapper [class^="icon-"], #wrapper [class*=" icon-"]'); o.icon=ic?ic.className+' -> '+getComputedStyle(ic).fontFamily:'MISSING';
o.text_font=cs('#wrapper .game_title a','font-family'); o.thumb=cs('#wrapper .game_thumb','background-color');
o.svgicons_in_wrapper=document.querySelectorAll('#wrapper svg.svgicon').length;
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
