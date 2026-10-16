(function(){
var gc=document.querySelector('.game_column');
gc.insertAdjacentHTML('beforeend','<div class="collection_row"><h2 style="color:rgb(10,20,30)"><a href="#x" id="colA">Col</a></h2></div><div class="purchased_games" style="display:block"><h2 style="color:rgb(10,20,30)"><a href="#y" id="purA">Pur</a></h2></div>');
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var o={
 T1_id_beats_theme_nested_0_4_1: c('.game_title a.title','color'),
 T2_equal_spec_later_wins: c('.game_text','color'),
 T3_low_spec_loses_to_theme: c('.game_genre','color'),
 T4a_collection_h2a_no_important: c('#colA','color'),
 T4b_purchased_h2a_important: c('#purA','color'),
 T6a_var_on_wrapper_shadowed_by_user_page: c('.user_page','--itchio_link_color'),
 T6b_var_on_wrapper_user_page: c('.user_page','--itchio_gray_back'),
 T8_grid_gap_hook: c('.game_grid_widget','column-gap'),
 T9_import_at_top_applies: c('.user_links','outline-color')+' '+c('.user_links','outline-style'),
 T12_imported_loses_tie_to_later_custom: c('.user_profile','color'),
 footer_font: c('.footer','font-family'), footer_color: c('.footer','color'),
};
var a=document.querySelector('.footer a'); a.focus(); o.T7_focus_color_in_wrapper=getComputedStyle(a).outlineColor;
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
