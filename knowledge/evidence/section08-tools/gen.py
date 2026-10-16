# Generate itch-like lab pages (section 08 re-check, 2026-10-14). usage: python -I gen.py <www_dir>
import sys, os
www = sys.argv[1]
HARNESS = r"""window.R={};
function cs(sel,prop){const e=document.querySelector(sel);if(!e)return 'NOEL';return getComputedStyle(e).getPropertyValue(prop).trim();}
function anims(sel){const e=document.querySelector(sel);return e?e.getAnimations().map(a=>a.animationName+':'+a.playState):'NOEL';}
function sheetInfo(){const s=document.getElementById('custom_css').sheet;const out=[];
 for(const r of s.cssRules){ if(r instanceof CSSImportRule){let n='?',t={};
  try{const rr=r.styleSheet.cssRules;n=rr.length;for(const x of rr){t[x.constructor.name]=(t[x.constructor.name]||0)+1;
     if(x.cssRules){for(const y of x.cssRules){const k='nested:'+y.constructor.name;t[k]=(t[k]||0)+1;}}}}catch(e){n=e.name;}
  out.push({href:r.href.split('/').pop(),layer:r.layerName,rules:n,types:t});} }
 return out;}
window.addEventListener('load',()=>{try{
 R.imports=sheetInfo();
 R.outside={bodyMargin:cs('body','margin-top'),bodyFont:cs('body','font-family').slice(0,40),h1:[cs('.outside-h1','margin-top'),cs('.outside-h1','font-size'),cs('.outside-h1','font-weight')],a:cs('.outside-a','color'),itchBounce:anims('.animate_bounce'),itchBounceTf:cs('.animate_bounce','transform'),itchBounceOp:cs('.animate_bounce','opacity'),dropdownVis:cs('.header_dropdown','visibility')};
 R.inside={a:cs('.in-a','color'),danger:cs('.in-a2','color'),flex:cs('.flex','display'),btnPad:cs('.btn','padding-left'),btnBg:cs('.btn','background-color'),title:[cs('.custom-title','margin-top'),cs('.custom-title','font-size')],pop:anims('.custom-pop'),popTf:cs('.custom-pop','transform'),spinner:anims('.spinner-border'),bsVarWrap:cs('#wrapper','--bs-body-font-family').slice(0,30),bsVarHtml:cs('html','--bs-body-font-family').slice(0,30)};
}catch(e){R.error=String(e);}
const p=document.createElement('pre');p.id='out';p.textContent='RESULT '+JSON.stringify(R);document.body.appendChild(p);});
"""
THEME = ('.user_page a{color:rgb(1,2,3)} @keyframes bounce{from,to{opacity:.25}} '
         '.animate_bounce{animation:bounce 1s linear -0.5s paused} '
         '.header_widget .header_dropdown:not(.visible){visibility:hidden}')
BODY = ('<div class="header_widget"><h1 class="outside-h1">Outside</h1><a class="outside-a" href="#x">link</a> '
        '<span class="button small">Follow</span><div class="animate_bounce">itch bounce</div>'
        '<div class="header_dropdown visible">menu</div></div>'
        '<div id="wrapper" class="user_page_wrap"><div class="user_page"><div class="user_profile formatted">'
        '<h1 class="custom-title">Title</h1><a class="in-a" href="#y">in link</a> <a class="text-danger in-a2" href="#z">danger</a>'
        '<div class="custom-pop">pop</div><div class="flex custom-flex">flex?</div><span class="btn btn-primary">btn</span>'
        '<div class="spinner-border"></div></div></div></div>')
POP = '#wrapper .custom-pop{animation:%s 1s linear -0.5s paused both}'
PAGES = {
 'p0-none':        '',
 'p1-tw':          '@import url("tw-index.css");',
 'p2-animate':     '@import url("animate.css");' + POP % 'bounceIn',
 'p3-animate-wrapped': '@import url("animate-wrapped.css");' + POP % 'bounceIn',
 'p4-bs':          '@import url("bootstrap.css");',
 'p5-bs-wrapped':  '@import url("bootstrap-wrapped.css");',
 'p6-bs-layer':    '@import url("bootstrap.css") layer(fw);',
 'p7-bs-scoped':   '@import url("bootstrap-scoped.css");',
 'p9-bs-atscope':  '@import url("bootstrap-atscope.css");',
 'p10-animate-atscope': '@import url("animate-atscope.css");' + POP % 'bounceIn',
 'p11-animate-renamed': '@import url("animate-renamed.css");' + POP % 'custom-bounceIn',
 'p12-animate-layer': '@import url("animate.css") layer(fw);' + POP % 'bounceIn',
}
open(os.path.join(www, 'harness.js'), 'w', encoding='utf-8').write(HARNESS)
for name, css in PAGES.items():
    html = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title><script src="harness.js"></script>'
            '<style id="user_theme">' + THEME + '</style><style id="custom_css">' + css + '</style></head><body>' + BODY + '</body></html>')
    open(os.path.join(www, name + '.html'), 'w', encoding='utf-8').write(html)
print('pages:', ', '.join(PAGES))
