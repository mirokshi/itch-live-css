# Generates the lab test pages into ./pages. Page origin A = http://localhost:8701,
# asset origin B = http://127.0.0.1:8702 (cross-site, like <user>.itch.io -> *.vercel.app).
import os
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "pages")
B = "http://127.0.0.1:8702"

def css(n, **kw):
    """URL of a lab stylesheet that sets --n:applied on :root (+ options)."""
    q = "n=" + n + "".join(f"&{k}={quote(str(v), safe='')}" for k, v in kw.items())
    return f"{B}/css?{q}"

RESULT_JS = r"""
<script>
window.__names = %s;
window.__result = async () => {
  await new Promise(r => setTimeout(r, 300));
  const cs = getComputedStyle(document.documentElement);
  const props = {};
  for (const n of window.__names) props[n] = cs.getPropertyValue('--' + n).trim() || '(not applied)';
  const res = performance.getEntriesByType('resource').map(e => ({
    name: e.name.replace('http://127.0.0.1:8702', 'B').replace('http://localhost:8701', 'A'),
    start: Math.round(e.startTime), end: Math.round(e.responseEnd), blocking: e.renderBlockingStatus }));
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return { props, res, fcp: fcp ? Math.round(fcp.startTime) : null, extra: window.__extraFn ? await window.__extraFn() : null,
           marks: window.__marks || null };
};
</script>
"""

def page(name, head, body="<p id=box class='b c'>text</p>", names=(), doctype=True, extra_script=""):
    html = ("<!DOCTYPE html>" if doctype else "") + "<html><head><meta charset='utf-8'>" + head + \
           "</head><body>" + body + (RESULT_JS % repr(list(names))) + extra_script + "</body></html>"
    with open(os.path.join(P, name), "w", encoding="utf-8") as f:
        f.write(html)

# 1. MIME / status / failure handling (standards + quirks)
mime_imports = [
    ("m_css", css("m_css")),
    ("m_css_charset", css("m_css_charset", ct="text/css; charset=utf-8")),
    ("m_plain", css("m_plain", ct="text/plain")),
    ("m_html", css("m_html", ct="text/html")),
    ("m_none", css("m_none", ct="none")),
    ("m_octet", css("m_octet", ct="application/octet-stream")),
    ("m_404", css("m_404", status=404)),
    ("m_500", css("m_500", status=500)),
    ("m_redir", css("m_redir", redirect=1)),
    ("m_plain_same", "/css?n=m_plain_same&ct=text%2Fplain"),
    ("m_refused", "http://127.0.0.1:1/refused.css"),
]
mime_head = "<style>" + "".join(f"@import url('{u}');" for _, u in mime_imports) + \
    ":root{--after:applied}" + f"@import url('{css('m_late')}');" + "</style>"
names = [n for n, _ in mime_imports] + ["after", "m_late"]
page("mime.html", mime_head, names=names)
page("mime-quirks.html", mime_head, names=names, doctype=False)

# 2. Cascade/conditions of @import
order_head = "<style>" + \
    f"@import url('{css('o_layer', extra='#box{color:rgb(255,0,0)}')}') layer(ext);" + \
    f"@import url('{css('o_tie', extra='.c{background-color:rgb(255,0,0)}')}');" + \
    f"@import url('{css('o_print')}') print;" + \
    f"@import url('{css('o_sup_false')}') supports(display:nonexistentvalue);" + \
    f"@import url('{css('o_sup_true')}') supports(display:grid);" + \
    f"@import url('{css('o_rm')}') (prefers-reduced-motion: reduce);" + \
    f"@import url('{css('o_wide')}') (min-width: 100000px);" + \
    ".b{color:rgb(0,128,0)} .c{background-color:rgb(0,0,255)}</style>"
order_extra = "<script>window.__extraFn=()=>{const s=getComputedStyle(document.getElementById('box'));return {color:s.color,bg:s.backgroundColor}};</script>"
page("order.html", order_head, names=["o_layer", "o_tie", "o_print", "o_sup_false", "o_sup_true", "o_rm", "o_wide"],
     extra_script=order_extra)

# 3. Fonts and CORS
fonts = {
    "FA": f"{B}/font?acao=none&k=FA",                    # inline @font-face, cross-origin, no ACAO
    "FB": f"{B}/font?acao=*&k=FB",                       # cross-origin, ACAO *
    "FC": f"{B}/font?acao=http://localhost:8701&k=FC",   # cross-origin, ACAO = page origin
    "FS": "/font?acao=none&k=FS",                          # same-origin as the page, no ACAO
}
font_head = "<style>" + \
    f"@import url('{css('f_imp1', extra='@font-face{font-family:FD;src:url(/font?acao=none&k=FD)}')}');" + \
    f"@import url('{css('f_imp2', extra='@font-face{font-family:FE;src:url(/font?acao=*&k=FE)}')}');" + \
    "".join(f"@font-face{{font-family:{k};src:url('{v}')}}" for k, v in fonts.items()) + "</style>"
font_body = "".join(f"<p style='font-family:{k}'>Mirokshi {k}</p>" for k in ["FA", "FB", "FC", "FS", "FD", "FE"])
font_extra = """<script>window.__extraFn=async()=>{
  for (const f of ['FA','FB','FC','FS','FD','FE']) { try { await document.fonts.load('16px '+f, 'Mirokshi'); } catch(e){} }
  await document.fonts.ready; const out={}; document.fonts.forEach(ff=>{out[ff.family]=ff.status}); return out;};</script>"""
page("font.html", font_head, body=font_body, names=["f_imp1", "f_imp2"], extra_script=font_extra)

# 4. CSSOM access to imported cross-origin sheets
cssom_head = "<style>" + \
    f"@import url('{css('c_noacao')}');" + \
    f"@import url('{css('c_acao', acao='*')}');" + \
    "@import url('/css?n=c_same');</style>"
cssom_extra = """<script>window.__extraFn=()=>{const out={};const rules=document.styleSheets[0].cssRules;
  for (const r of rules){ let v; try { v = r.styleSheet.cssRules.length + ' rules readable'; } catch(e) { v = e.name; }
    out[r.href.replace('http://127.0.0.1:8702','B')] = v; } return out;};</script>"""
page("cssom.html", cssom_head, names=["c_noacao", "c_acao", "c_same"], extra_script=cssom_extra)

# 5. Waterfall: an @import inside an imported sheet is only discovered after its parent arrives
w2 = css("w2", delay=800)
wf_head = "<style>" + f"@import url('{css('w1', delay=800, imp=w2)}');" + \
    f"@import url('{css('p1', delay=800)}');" + "</style>" + \
    "<script>window.__marks={afterStyleScript:Math.round(performance.now())};</script>"
page("waterfall.html", wf_head, names=["w1", "w2", "p1"])

# 6. Render blocking: a slow @import delays first paint; a refused connection does not
page("block.html", "<style>" + f"@import url('{css('blk', delay=2500)}');" + "</style>", names=["blk"])
page("noblock.html", "<style>:root{--none:applied}</style>", names=["none"])
page("refused.html", "<style>@import url('http://127.0.0.1:1/refused.css');:root{--after:applied}</style>", names=["after"])

# 7. Referer of each request kind under itch's Referrer-Policy (no-referrer-when-downgrade)
r2 = css("r2")
r4 = css("r4")
ref_head = "<style>" + \
    f"@import url('{css('r1', imp=r2, extra='#x{background:url(/img?k=r1img)} @font-face{font-family:RF;src:url(/font?acao=*&k=r1font)}')}');" + \
    f"@import url('{css('r3', imp=r4, rp='no-referrer-when-downgrade')}');" + \
    f"#y{{background:url('{B}/img?k=inline_img')}}" + "</style>"
ref_body = "<div id=x style='width:10px;height:10px'></div><div id=y style='width:10px;height:10px'></div><p style='font-family:RF'>Mirokshi</p>"
page("ref.html", ref_head, body=ref_body, names=["r1", "r2", "r3", "r4"],
     extra_script="<script>window.__extraFn=async()=>{await document.fonts.load('16px RF','M');return 'ok'}</script>")

# 8. bfcache: page with a no-store @import (page itself cacheable), then a second page
page("bf1.html", "<style>" + f"@import url('{css('bf', cc='no-store')}');" + "</style>", names=["bf"],
     extra_script="<script>window.__pageshows=[];addEventListener('pageshow',e=>window.__pageshows.push(e.persisted));</script>")
page("bf2.html", "<style>:root{--two:applied}</style>", names=["two"])
# 9. Preload scanner: itch puts sync <script src> tags BEFORE style#custom_css. Is the @import fetched in parallel?
page("scanner.html", f"<script src='{B}/js?delay=1500&k=s1'></script>" + "<style>" + f"@import url('{css('ps', delay=200)}');" + "</style>",
     names=["ps"])
# 10. Referer of requests made by an imported sheet to a THIRD origin (like Google CSS -> fonts.gstatic.com)
C = "http://localhost:8702"
page("ref2.html", "<style>" + f"@import url('{css('x1', imp=C + '/css?n=x2', extra='#x{background:url(' + C + '/img?k=x1img)} @font-face{font-family:XF;src:url(' + C + '/font?acao=*&k=x1font)}')}');" + "</style>",
     body="<div id=x style='width:10px;height:10px'></div><p style='font-family:XF'>Mirokshi</p>", names=["x1", "x2"],
     extra_script="<script>window.__extraFn=async()=>{await document.fonts.load('16px XF','M');return 'ok'}</script>")
# 11. Is a "Link: rel=preconnect" response header on an imported stylesheet honoured? (sockwatch on :8703 / :8704)
page("linkhdr.html", "<style>" + f"@import url('{css('lh', link='<http://127.0.0.1:8703>; rel=preconnect')}');" + "</style>", names=["lh"],
     extra_script="<script>window.__extraFn=async()=>{await new Promise(r=>setTimeout(r,1500));return 'waited'}</script>")
page("bodypreconnect.html", "", body="<p>x</p><link rel=preconnect href='http://127.0.0.1:8704'>", names=[],
     extra_script="<script>window.__extraFn=async()=>{await new Promise(r=>setTimeout(r,1500));return 'waited'}</script>")
# 12. @import ... scope(#wrapper) (css-cascade-6 draft): supported? if not, is the whole @import dropped?
page("scope.html", "<style>" + f"@import url('{css('sc', extra='p{color:rgb(255,0,0)}')}') scope(#wrapper);" + "</style>",
     body="<p id=outside>out</p><div id=wrapper><p id=inside>in</p></div>", names=["sc"],
     extra_script="<script>window.__extraFn=()=>({outside:getComputedStyle(document.getElementById('outside')).color,inside:getComputedStyle(document.getElementById('inside')).color,ruleText:document.styleSheets[0].cssRules[0]?.cssText||'(no rule)',media:document.styleSheets[0].cssRules[0]?.media?.mediaText,scopeProp:('scope' in CSSImportRule.prototype),layerName:document.styleSheets[0].cssRules[0]?.layerName,supportsText:document.styleSheets[0].cssRules[0]?.supportsText})</script>")

# ---- verifier additions (2026-10-14): @import validity, end-of-body script, reload ----
v_head = ("<style>@layer base;" + f"@import url('{css('v_after_layer_stmt')}');" + "</style>"
  + "<style>@charset \"utf-8\";" + f"@import url('{css('v_after_charset')}');" + "</style>"
  + "<style>@font-face{font-family:Z;src:local(Arial)}" + f"@import url('{css('v_after_fontface')}');" + "</style>"
  + "<style>@media screen{" + f"@import url('{css('v_in_media')}');" + "}</style>"
  + "<style>@supports (display:grid){" + f"@import url('{css('v_in_supports')}');" + "}</style>"
  + "<style>" + f"@import url('{css('v_dup')}');@import url('{css('v_dup')}');" + "</style>"
  + "<style>" + f"@import '{css('v_string')}';" + "</style>")
page("validity.html", v_head, names=["v_after_layer_stmt","v_after_charset","v_after_fontface","v_in_media","v_in_supports","v_dup","v_string"])
page("bodyscript.html", "<style>" + f"@import url('{css('bs', delay=1200)}');" + "</style>", body="<p>x</p>", names=["bs"],
     extra_script="<script>window.__marks={endOfBodyScript:Math.round(performance.now())};</script>")
page("rl1.html", "<style>" + f"@import url('{css('rl', cc='no-store')}');" + "</style>", names=["rl"])
# ---- verifier-2 additions (2026-10-14): cross-origin redirect, layered !important, cookie round trip ----
Cx = "http://localhost:8702"
page("redirxo.html", "<style>" + f"@import url('{css('rx_dummy', loc=Cx + '/css?n=rx_xo')}');" + f"@import url('{css('rx_dummy2', loc=Cx + '/css?n=rx_xo404&status=404')}');" + "</style>", names=["rx_xo","rx_xo404"])
page("order2.html", "<style>" + f"@import url('{css('o2_layer', extra='#box{color:rgb(255,0,0)!important}')}') layer(ext);" + ".b{color:rgb(0,128,0)}</style>", names=["o2_layer"],
     extra_script="<script>window.__extraFn=()=>({color:getComputedStyle(document.getElementById('box')).color})</script>")
page("cookie1.html", "<style>" + f"@import url('{css('ck1', setcookie='vis=abc123; Path=/; SameSite=None; Secure')}');" + f"@import url('{css('ck1lax', setcookie='lax=1; Path=/')}');" + "</style>", names=["ck1","ck1lax"])
page("cookie2.html", "<style>" + f"@import url('{css('ck2')}');" + "</style>", names=["ck2"])
print("pages written:", sorted(os.listdir(P)))
