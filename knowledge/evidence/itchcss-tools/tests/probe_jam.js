(function(){
var vj=document.querySelector('.view_jam_page');
vj.insertAdjacentHTML('beforeend','<div class="grid_outer"><div class="game_grid_widget"><div class="game_cell"><div class="game_cell_data"><div class="game_title"><a class="title" href="#t">T</a></div><div class="game_text">txt</div><div class="game_genre">g</div></div></div></div><div class="itch_footer">f</div></div>');
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var hw=document.querySelector('.header_widget');
var o={vw:innerWidth,
 J1_id_rule_vs_theme_important: c('.game_text','color'),
 J2_id_rule_with_important: c('.game_genre','color'),
 J3_var_on_wrapper_link: c('#wrapper','--itchio_link_color')+' / a color: '+c('.jam_content a','color'),
 J3_button: c('.join_jam_btn','background-color'),
 header_inside_wrapper: document.getElementById('wrapper').contains(hw),
 header: {position:c('.header_widget','position'),height:c('.header_widget .primary_header','height'),bg:c('.header_widget .primary_header','background-color'),z:c('.header_widget .primary_header','z-index'),font:c('.header_widget','font-family')},
 skip: {pos:c('.skip_to_main','position'),top:c('.skip_to_main','top'),z:c('.skip_to_main','z-index'),bg:c('.skip_to_main','background-color')},
 wrap: {display:c('#wrapper','display'),minh:c('#wrapper','min-height'),color:c('#wrapper','color'),font:c('#wrapper','font-family'),bgimg:c('#wrapper','background-image').slice(0,40)},
 jam_body: {maxw:c('.jam_body','max-width'),mt:c('.jam_body','margin-top'),ml:c('.jam_body','margin-left'),overflow:c('.jam_body','overflow'),bg:c('.jam_body','background-color'),radius:c('.jam_body','border-radius')},
 jam_title: {fs:c('.jam_title_header','font-size'),fw:c('.jam_title_header','font-weight')},
 jam_content: {fs:c('.jam_content','font-size'),lh:c('.jam_content p','line-height')},
 jam_banner_outer: c('.jam_banner_outer','display'),
};
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
