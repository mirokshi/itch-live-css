"""Build offline render harnesses from a captured direct-download project page.
usage: python -I ddl_harness.py <captured.html> <local game.css> <outdir>
Writes <outdir>/ddl-<variant>.html for variants: base (itch CSS + page theme only) and fix (+ the candidate rule).
All <script> elements, external <link>s and src/srcset attributes are removed (no network);
the page's game.css link is pointed at the local copy. A probe script appends JSON results to <pre id=probe>."""
import sys, re, os, shutil
src, css, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
shutil.copy(css, os.path.join(out, 'game.css'))
t = open(src, encoding='utf-8').read()
t = re.sub(r'<script\b.*?</script>', '', t, flags=re.S)
t = re.sub(r'<link\b[^>]*>', '', t)
t = re.sub(r'\s(?:src|srcset)="[^"]*"', '', t)
t = re.sub(r'<style[^>]*id="custom_css"[^>]*>.*?</style>', '', t, flags=re.S)  # test itch defaults only
probe = """
<pre id="probe"></pre><script>
(function(){
  var q=function(s){return document.querySelector(s)}, cs=function(e,p){return e?getComputedStyle(e)[p]:'(absent)'};
  var r={innerWidth:innerWidth,
    pageWidget:(q('.view_game_page')||{}).className,
    header_buy_row:cs(q('.header_buy_row'),'display'),
    direct_download_row:cs(q('.direct_download_row'),'display'),
    direct_download_btn_rendered: !!(q('.direct_download_btn') && q('.direct_download_btn').getClientRects().length),
    uploads_download_btns_rendered: Array.prototype.filter.call(document.querySelectorAll('.uploads .download_btn'),function(e){return e.getClientRects().length>0}).length,
    buy_row_count: document.querySelectorAll('.buy_row').length};
  document.getElementById('probe').textContent='PROBE '+JSON.stringify(r);
})();
</script>"""
fix = '<style id="candidate">#wrapper .view_game_page.direct_download .header_buy_row{display:block}</style>'
head_link = '<link rel="stylesheet" href="game.css">'
base = t.replace('<head>', '<head>' + head_link, 1)
for name, extra in (('base', ''), ('fix', fix)):
    h = base.replace('</head>', extra + '</head>', 1).replace('</body>', probe + '</body>', 1)
    open(os.path.join(out, f'ddl-{name}.html'), 'w', encoding='utf-8').write(h)
print('ok', out)
