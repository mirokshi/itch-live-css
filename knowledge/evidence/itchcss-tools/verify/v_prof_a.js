(function(){
var gc=document.querySelector('.game_column');
gc.insertAdjacentHTML('beforeend','<div class="collection_row"><h2 style="color:rgb(10,20,30)"><a href="#x" id="colA">Col</a></h2></div><div class="purchased_games"><h2 style="color:rgb(10,20,30)"><a href="#y" id="purA">Pur</a></h2></div>');
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var cs=document.getElementById('custom_css').sheet;
var o={
 title:c('.game_title a.title','color'), text_tie:c('.game_text','color'), genre_low:c('.game_genre','color'),
 colA:c('#colA','color'), purA:c('#purA','color'),
 up_link:c('.user_page','--itchio_link_color'), wrap_link:c('#wrapper','--itchio_link_color'), up_gray:c('.user_page','--itchio_gray_back'),
 a_color:c('.user_profile a','color'),
 colgap:c('.game_grid_widget','column-gap'), rowgap:c('.game_grid_widget','row-gap'),
 import_rule_count:Array.prototype.filter.call(cs.cssRules,function(r){return r.type===3}).length,
 import_applied:c('.user_links','border-top-color')+' '+c('.user_links','border-top-width'),
 imported_vs_own_tie:c('.user_profile','color'),
 footer_color:c('.footer','color'), footer_font:c('.footer','font-family'), footer_fs:c('.footer','font-size'), footer_a:c('.footer a','color'),
 n_game_cells:document.querySelectorAll('.game_cell').length
};
var a=document.querySelector('.footer a'); a.focus(); o.focus_link=getComputedStyle(a).outlineColor+' '+getComputedStyle(a).outlineStyle+' '+getComputedStyle(a).outlineWidth+' active='+(document.activeElement===a);
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
