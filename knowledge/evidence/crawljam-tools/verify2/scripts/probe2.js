setTimeout(function () {
  var o = {};
  function cs(sel, prop, pseudo) {
    var e = document.querySelector(sel);
    if (!e) return null;
    return getComputedStyle(e, pseudo || null).getPropertyValue(prop);
  }
  var W = document.getElementById('wrapper');
  o.vw = window.innerWidth;
  o.wrapper_is_jam_page_wrap = !!W && W.classList.contains('jam_page_wrap');
  o.wrapper_parent = W && W.parentElement.tagName;
  o.wrapper_prev_sibling = W && W.previousElementSibling && W.previousElementSibling.className;
  o.wrapper_display = cs('#wrapper', 'display');
  o.wrapper_min_height = cs('#wrapper', 'min-height');
  o.wrapper_bg_image = (cs('#wrapper', 'background-image') || '').slice(0, 40);
  o.wrapper_bg_color = cs('#wrapper', 'background-color');
  o.wrapper_var_link = cs('#wrapper', '--itchio_link_color');
  o.content_link = cs('.jam_content a', 'color');
  o.host_link = cs('.jam_host_header a', 'color');
  o.join_btn_bg = cs('.join_jam_btn', 'background-color');
  o.site_header_bg = cs('.primary_header', 'background-color');
  o.site_header_link = cs('.primary_header .header_buttons a', 'color');
  o.site_logo_maxw = cs('.primary_header img', 'max-width');
  o.jam_body_radius = cs('.jam_body', 'border-top-left-radius');
  o.submitter_radius = cs('.jam_submitter_widget', 'border-top-left-radius');
  o.jam_body_maxw = cs('.jam_body', 'max-width');
  o.jam_body_mt = cs('.jam_body', 'margin-top');
  o.jam_body_ml = cs('.jam_body', 'margin-left');
  o.jam_body_overflow = cs('.jam_body', 'overflow');
  o.jam_body_bg = cs('.jam_body', 'background-color');
  o.jam_body_shadow = cs('.jam_body', 'box-shadow');
  o.title_fs = cs('.jam_title_header', 'font-size');
  o.stats_display = cs('.stats_container', 'display');
  o.tabs_overflow = cs('.header_tabs', 'overflow-x');
  o.tab_active_border = cs('.header_tabs .header_tab.active', 'border-bottom-color');
  o.header_widget_border = cs('.jam_header_widget', 'border-bottom-color');
  o.community_activity_bg = cs('.header_tabs .community_activity', 'background-color');
  o.grid_header_row_border = cs('.grid_outer .header_row', 'border-bottom-color');
  o.filter_active_border = cs('.jam_filter_picker .filter_item.active', 'border-bottom-color');
  o.itch_footer_border = cs('.grid_outer .itch_footer', 'border-top-color');
  o.game_text = cs('.game_cell .game_text', 'color');
  o.game_title_a = cs('.game_cell .game_title a', 'color');
  o.grid_mt = cs('#entries', 'margin-top');
  o.banner_display = cs('.jam_banner', 'display');
  o.banner_maxw = cs('.jam_banner', 'max-width');
  o.h1_font = cs('.jam_title_header', 'font-family');
  var t = document.getElementById('jam_theme');
  if (t && t.sheet) {
    var types = {};
    [].forEach.call(t.sheet.cssRules, function (r) { types[r.constructor.name] = (types[r.constructor.name] || 0) + 1; });
    o.jam_theme_rule_types = types;
  }
  document.getElementById('v2out').textContent = 'V2RESULT ' + JSON.stringify(o);
}, 400);
