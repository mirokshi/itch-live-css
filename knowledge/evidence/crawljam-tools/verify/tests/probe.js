(function(){
 function q(s){return document.querySelector(s)}
 function cs(s,p,ps){var e=q(s);return e?getComputedStyle(e,ps||null).getPropertyValue(p).trim():null}
 var o={ua:navigator.userAgent.match(/Chrome\/[\d.]+/)[0],vw:innerWidth};
 o.wrap_is_jam_page_wrap=!!q('#wrapper.jam_page_wrap');
 o.wrap_parent=q('#wrapper').parentElement.tagName;
 o.wrap_prev=q('#wrapper').previousElementSibling&&q('#wrapper').previousElementSibling.className;
 o.wrap_bgimg=cs('#wrapper','background-image').slice(0,40);
 o.wrap_bgcolor=cs('#wrapper','background-color');
 o.wrap_display=cs('#wrapper','display');o.wrap_minh=cs('#wrapper','min-height');
 o.wrap_linkvar=cs('#wrapper','--itchio_link_color');
 o.root_linkvar=getComputedStyle(document.documentElement).getPropertyValue('--itchio_link_color').trim();
 o.content_a=cs('.jam_content a','color');o.host_a=cs('.jam_host_header a','color');
 o.siteheader_a=cs('.header_widget .header_buttons a','color');
 o.siteheader_bg=cs('.header_widget .primary_header','background-color');
 o.siteheader_img_maxw=cs('.header_widget img','max-width');
 o.join_bg=cs('.jam_submitter_widget .button','background-color');
 o.jam_body_bg=cs('.jam_body','background-color');
 o.jam_body_radius=cs('.jam_body','border-top-left-radius');
 o.sub_radius=cs('.jam_submitter_widget','border-top-left-radius');
 o.jam_body_maxw=cs('.jam_body','max-width');o.jam_body_mt=cs('.jam_body','margin-top');o.jam_body_ml=cs('.jam_body','margin-left');
 o.jam_body_overflow=cs('.jam_body','overflow');
 o.title_fs=cs('.jam_title_header','font-size');o.stats_disp=cs('.stats_container','display');
 o.content_margin=cs('.jam_content','margin-top');
 o.tabs_overflow=cs('.header_tabs','overflow-x');
 o.game_text=cs('.game_cell .game_text','color');o.game_title=cs('.game_cell .game_title a','color');
 o.filter_active_border=cs('.jam_filter_picker .filter_item.active','border-bottom-color');
 o.tab_active_border=cs('.header_tabs .header_tab.active','border-bottom-color');
 o.header_row_border=cs('.grid_outer .header_row','border-bottom-color');
 o.jam_header_border=cs('.jam_header_widget','border-bottom-color');
 o.itch_footer_border=cs('.grid_outer .itch_footer','border-top-color');
 o.community_bg=cs('.header_tabs .community_activity','background-color');
 o.banner_disp=cs('.jam_banner','display');o.banner_maxw=cs('.jam_banner','max-width');
 o.grid_mt=cs('.grid_outer','margin-top');
 var s=document.getElementById('jam_theme').sheet;o.theme_rules=s.cssRules.length;
 o.theme_types=[].map.call(s.cssRules,function(r){return r.constructor.name}).filter(function(n){return n!='CSSStyleRule'});
 document.getElementById('vout').textContent='VRESULT '+JSON.stringify(o);
})();
