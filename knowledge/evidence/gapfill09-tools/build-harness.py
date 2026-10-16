# Wrap every <outDir>/*.css (plus the fixtures) in an itch-like page: a mock theme <style id="user_theme">
# first, then the CSS inline in <style id="custom_css">, then #wrapper with one probe element per fixture rule.
# usage: python -I build-harness.py <fixtureDir> <outDir>
import glob, os, shutil, sys
fx, out = sys.argv[1], sys.argv[2]
shutil.copy(os.path.join(fx, "imp.css"), os.path.join(out, "imp.css"))
shutil.copy(os.path.join(fx, "src.css"), os.path.join(out, "main.source.css"))
shutil.copy(os.path.join(fx, "src-layerfirst.css"), os.path.join(out, "lf.source.css"))
BODY = """<div id="wrapper" class="user_page_wrap"><div class="user_page" style="width:500px">
<span class="p-alt">a</span><div class="p-rand"></div><div class="p-bdf"></div><div class="p-mix"></div>
<div class="p-mixv">m</div><div class="p-fut">f</div>
<div><i></i><i></i><i class="p-sib"></i></div>
<p class="p-sel">sel</p><div class="p-calc"></div><div class="p-calc0"></div>
<span class="p-str"></span><span class="p-raw"></span><span class="p-esc"></span>
<div class="p-nest">n<div class="p-kid">k</div></div><div class="p-nest p-deep">d</div>
<div class="p-prop"></div><div class="p-layer">l</div><div class="p-tie">t</div><div class="p-imp">i</div>
<div class="p-x p-y">x</div><div class="p-u p-v">u</div><div class="p-dbl">d</div>
<div class="p-mq">q</div><div class="p-mq2">q</div><div class="p-sh1 p-sh2">s</div><div class="p-and">a</div>
<div class="p-svg"></div><div class="p-start">s</div>
</div></div>"""
for css in glob.glob(os.path.join(out, "*.css")):
    name = os.path.basename(css)[:-4]
    if name == "imp":
        continue
    text = open(css, encoding="utf-8").read()
    assert "</style" not in text.lower()
    html = ('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>%s</title>\n'
            '<style id="user_theme">.user_page{color:rgb(20,20,20)}</style>\n'
            '<style id="custom_css" type="text/css">%s</style></head><body>%s</body></html>\n') % (name, text, BODY)
    with open(os.path.join(out, "h-%s.html" % name), "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print("h-%s.html" % name)
