(function(){
var vj=document.querySelector('.view_jam_page');
vj.insertAdjacentHTML('beforeend','<div class="grid_outer"><div class="game_grid_widget"><div class="game_cell"><div class="game_cell_data"><div class="game_title"><a class="title" href="#t">T</a></div><div class="game_text">txt</div><div class="game_genre">g</div></div></div></div></div>');
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var st=document.getElementById('jam_theme').sheet;
var hw=document.querySelector('.header_widget');
var fams=[]; document.fonts.forEach(function(f){fams.push(f.family)});
var skip=document.querySelector('.skip_to_main');
var link=document.querySelector('.jam_content a, .jam_body a');
var btn=document.querySelector('.jam_body .button, .view_jam_page .button');
var o={vw:innerWidth,
 J1_no_important:c('.grid_outer .game_text','color'), J2_important:c('.grid_outer .game_genre','color'),
 J3_var:c('#wrapper','--itchio_link_color'), link_cls:link?link.className:null, link_color:link?getComputedStyle(link).color:null,
 btn_cls:btn?btn.className:null, btn_bg:btn?getComputedStyle(btn).backgroundColor:null,
 jam_theme_rules:st.cssRules.length, import_rules:Array.prototype.filter.call(st.cssRules,function(r){return r.type===3}).length,
 import_applied:c('#wrapper','outline-width'),
 fontface_registered:fams.indexOf('CustomProbeFace')>=0, fontface_rules:Array.prototype.filter.call(st.cssRules,function(r){return r.type===5}).length,
 header_inside_wrapper:document.getElementById('wrapper').contains(hw), header_cls:hw?hw.className:null,
 header:[c('.header_widget','position'),c('.header_widget .primary_header','height'),c('.header_widget .primary_header','background-color'),c('.header_widget .primary_header','z-index'),c('.header_widget','z-index')].join(' | '),
 ui_bg:c(':root','--itchio_ui_bg'),
 skip:skip?skip.getAttribute('href')+' target_exists='+!!document.getElementById((skip.getAttribute('href')||'#').slice(1)):null,
 wrap:[c('#wrapper','display'),c('#wrapper','min-height'),c('#wrapper','font-family'),c('#wrapper','background-image').slice(0,30)].join(' | '),
 jam_body:[c('.jam_body','max-width'),c('.jam_body','margin-top'),c('.jam_body','margin-left'),c('.jam_body','overflow'),c('.jam_body','background-color')].join(' | '),
 title:[c('.jam_title_header','font-size'),c('.jam_title_header','font-weight'),c('.jam_title_header','font-family')].join(' | '),
 h_font:c('.view_jam_page h2','font-family'),
 body:[c('body','font-size'),c('body','background-color')].join(' | '),
 has_footer:!!document.querySelector('#wrapper .footer'), itch_footer:!!document.querySelector('.itch_footer'),
 h1s:Array.prototype.map.call(document.querySelectorAll('h1'),function(h){return h.className+':'+getComputedStyle(h).display})
};
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
