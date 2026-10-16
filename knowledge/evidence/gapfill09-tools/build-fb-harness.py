# Harness pages for the fallbacks fixture: one div per .f-NN inside a 500px .user_page.
# usage: python -I build-fb-harness.py <fixtureDir> <outDir>
import glob, os, shutil, sys
fx, out = sys.argv[1], sys.argv[2]
shutil.copy(os.path.join(fx, "fallbacks.css"), os.path.join(out, "fb.source.css"))
body = '<div id="wrapper" class="user_page_wrap"><div class="user_page" style="width:500px;position:relative">' + \
       "".join('<div class="f-%02d">t</div>' % i for i in range(1, 28)) + '</div></div>'
for css in glob.glob(os.path.join(out, "fb.*.css")):
    name = os.path.basename(css)[:-4]
    text = open(css, encoding="utf-8").read()
    html = ('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>%s</title>\n<style id="user_theme">.user_page{color:rgb(20,20,20)}</style>\n'
            '<style id="custom_css" type="text/css">%s</style></head><body>%s</body></html>\n') % (name, text, body)
    open(os.path.join(out, "h-%s.html" % name), "w", encoding="utf-8", newline="\n").write(html)
    print("h-%s.html" % name)
