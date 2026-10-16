(function(){
function c(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'MISSING';}
var w=document.getElementById('wrapper');
var ut=document.getElementById('user_tools');
var o={vw:innerWidth,
 wrapper:[c('#wrapper','display'),c('#wrapper','position'),c('#wrapper','padding-bottom'),c('#wrapper','z-index'),c('#wrapper','isolation'),c('#wrapper','min-height')].join(' | '),
 bg:[c('#wrapper','background-image').slice(0,40),c('#wrapper','background-repeat'),c('#wrapper','background-attachment')].join(' | '),
 body:[c('body','background-color'),c('body','font-family'),c('body','font-size'),c('body','color')].join(' | '),
 footer:[c('.footer','position'),c('.footer','bottom'),c('.footer','left'),c('.footer','right'),c('.footer','height'),c('.footer','color'),c('.footer','font-family'),c('.footer','font-size')].join(' | '),
 footer_parent:document.querySelector('.footer').parentElement.id, footer_in_user_page:!!document.querySelector('.user_page .footer'),
 user_page:[c('.user_page','color'),c('.user_page','font-size'),c('.user_page','font-family')].join(' | '),
 bio:[c('.user_profile','font-size'),c('.user_profile','line-height')].join(' | '),
 bio_h1:[c('.user_profile h1','font-size'),c('.user_profile h1','margin')].join(' | '),
 bio_h2:[c('.user_profile h2','font-size'),c('.user_profile h2','margin')].join(' | '),
 bio_p:[c('.user_profile p','margin'),c('.user_profile p','line-height')].join(' | '),
 text_h1:[c('.text_header>h1','font-size'),c('.text_header>h1','font-weight'),c('.text_header>h1','margin'),c('.text_header>h1','display')].join(' | '),
 inner:[c('.profile_content','max-width'),c('.profile_content','padding-left'),c('.profile_content','padding-right'),c('.profile_content','width')].join(' | '),
 grid:[c('.game_grid_widget','display'),c('.game_grid_widget','grid-template-columns'),c('.game_grid_widget','column-gap'),c('.game_grid_widget','row-gap'),c('.game_grid_widget','align-items'),c('.game_grid_widget','font-size')].join(' | '),
 user_tools:[c('#user_tools','position'),c('#user_tools','z-index'),c('#user_tools','top'),c('#user_tools','right'),c('#user_tools','opacity'),c('#user_tools','transform')].join(' | '),
 user_tools_cls:ut?ut.className:null, user_tools_tag:ut?ut.tagName:null, user_tools_in_wrapper:w.contains(ut),
 user_tools_text:ut?ut.textContent.trim().replace(/\s+/g,' ').slice(0,60):null,
 user_tools_link:ut&&ut.querySelector('a')?ut.querySelector('a').getAttribute('href').slice(0,60):null,
 body_children:Array.prototype.slice.call(document.body.children,0,6).map(function(e){return e.tagName+'#'+e.id+'.'+e.className}),
 has_header_widget:!!document.querySelector('.header_widget'), skip:!!document.querySelector('.skip_to_main'),
 user_page_cls:document.querySelector('.user_page').className, html_cls:document.documentElement.className, body_cls:document.body.className
};
document.getElementById('out').textContent=JSON.stringify(o,null,1);
})();
