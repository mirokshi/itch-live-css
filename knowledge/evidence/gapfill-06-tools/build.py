"""Gap-fill 06 (2026-10-14): re-run the x08-03 p12 framework test against REAL itch files.

Builds local test pages from a same-day copy of a live itch profile page (real DOM, real
style#user_theme) whose <link> to static.itch.io/user.css is rewritten to a local copy of the
real user.css, all <script> elements are removed, and style#custom_css is replaced by a variant.
Probe elements are appended and a probe script reads getAnimations()/getComputedStyle().

usage: python -I build.py <profile.html> <user.css> <animate.min.css> <www_dir>
Raw third-party/itch copies stay in <www_dir> (scratchpad only).
"""
import re, sys, shutil, os

prof, usercss, animcss, www = sys.argv[1:5]
os.makedirs(www, exist_ok=True)
shutil.copy(usercss, os.path.join(www, 'user.css'))
shutil.copy(animcss, os.path.join(www, 'animate.min.css'))

html = open(prof, encoding='utf-8').read()
# 1. local user.css
html, n = re.subn(r'href="https://static\.itch\.io/user\.css[^"]*"', 'href="user.css"', html)
assert n == 1, n
# 2. strip all scripts (no itch JS, no network)
html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S)
# 3. locate custom_css
m = re.search(r'(<style\b[^>]*\bid="custom_css"[^>]*>)(.*?)(</style>)', html, re.S)
assert m

POP = '#wrapper .custom-pop{animation:%s 1s linear -0.5s paused both}'
VARIANTS = {
    'v0-baseline':        '',
    'v1-animate-unlayered': '@import url("animate.min.css");' + POP % 'bounceIn',
    'v2-animate-layer':     '@import url("animate.min.css") layer(fw);' + POP % 'bounceIn',
    'v3-layer-use-bounce':  '@import url("animate.min.css") layer(fw);' + POP % 'bounce',
    'v4-layer-own-bounce':  '@import url("animate.min.css") layer(fw);' + POP % 'bounce'
                            + '@keyframes bounce{from,to{opacity:.25}}',
    'v5-tw-like-important': '@layer theme,base,components,utilities;'
                            '@layer utilities{.custom-red{color:rgb(200,0,0)!important}.custom-blue{color:rgb(0,0,200)}}'
                            '#wrapper .user_profile a.custom-red{color:rgb(0,150,0)!important}',
    'v6-layer-reset-leak':  '@import url("animate.min.css") layer(fw);'
                            '@layer fw{body{margin:7px}h1{letter-spacing:3px}}',
    'v7-earlier-layer-important': '@layer custom-override,theme,base,components,utilities;'
                            '@layer utilities{.custom-red{color:rgb(200,0,0)!important}}'
                            '@layer custom-override{.custom-red{color:rgb(0,150,0)!important}}',
    'v8-import-layer-override': '@layer custom-override,utilities;@import url("tw-like.css") layer(utilities);'
                            '@layer custom-override{.custom-red{color:rgb(0,150,0)!important}}',
}
open(os.path.join(www, 'tw-like.css'), 'w').write('.custom-red{color:rgb(200,0,0)!important}')

PROBES = ('<div class="custom-probes">'
          '<a href="#r" class="custom-red" id="red">red</a> '
          '<a href="#b" class="custom-blue" id="blue">blue</a> '
          '<span class="animate_bounce" id="k-in">in</span>'
          '<div class="custom-pop" id="pop">pop</div></div>')
OUTSIDE = ('<span class="animate_bounce" id="k-out">out</span>'
           '<span class="animate_heartbeat" id="k-hb">hb</span>'
           '<span class="user_panel_widget"><span class="notifications_bubble" id="k-bi">1</span></span>'
           '<span class="animate_drop_down" id="k-dd">dd</span>')

SCRIPT = r'''<script>
(function(){
function kf(id){var e=document.getElementById(id);if(!e)return 'NOEL';getComputedStyle(e).transform;
 var a=e.getAnimations();if(!a.length)return 'none';a=a[0];var f=a.effect.getKeyframes();
 var sig=f.map(function(k){return (k.transform||'')+(k.opacity!==undefined?'op'+k.opacity:'');}).join('|');
 return a.animationName+' frames='+f.length+' sig='+sig.slice(0,140);}
function cs(sel,p){var e=document.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(p).trim():'NOEL';}
var s=document.getElementById('custom_css').sheet,imp=[];
for(var i=0;i<s.cssRules.length;i++){var r=s.cssRules[i];if(r instanceof CSSImportRule){var n='?';try{n=r.styleSheet.cssRules.length}catch(x){n=x.name}imp.push({layer:r.layerName,rules:n});}}
var R={ua:navigator.userAgent.match(/Chrome\/[\d.]+/)[0],imports:imp,
 itch_bounce_outside:kf('k-out'),itch_bounce_inside:kf('k-in'),itch_heartbeat:kf('k-hb'),
 itch_bouncein:kf('k-bi'),itch_drop_down:kf('k-dd'),pop:kf('pop'),
 red:cs('#red','color'),blue:cs('#blue','color'),bio_link:cs('.user_profile a:not(.custom-red):not(.custom-blue)','color'),
 body_margin:cs('body','margin-top'),h1_ls:cs('.custom-title','letter-spacing'),
 theme_has_layer:/@layer/.test(document.getElementById('user_theme').textContent)};
var p=document.createElement('pre');p.id='out';p.textContent='RESULT '+JSON.stringify(R);document.body.appendChild(p);
})();
</script>'''

for name, css in VARIANTS.items():
    h = html[:m.start()] + m.group(1) + css + m.group(3) + html[m.end():]
    # probes inside the bio, outside elements right after <body>
    h, k = re.subn(r'(<div\b[^>]*class="[^"]*\buser_profile\b[^"]*"[^>]*>)', r'\1' + PROBES, h, count=1)
    assert k == 1
    h, k = re.subn(r'(<body\b[^>]*>)', r'\1' + OUTSIDE, h, count=1)
    assert k == 1
    h = h.replace('</body>', SCRIPT + '</body>')
    open(os.path.join(www, name + '.html'), 'w', encoding='utf-8').write(h)
    print('wrote', name)
