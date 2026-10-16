# Real-page equivalence: the repo's preview export with user.css made local, scripts removed,
# and <style id="custom_css"> replaced by each repo.*.css output.  usage: python -I build-repo-harness.py <outRepoDir>
import glob, os, re, sys
d = sys.argv[1]
base = open(os.path.join(d, "base.html.txt"), encoding="utf-8").read()
base = re.sub(r'https://static\.itch\.io/user\.css\?\d+', 'user.css', base)
base = re.sub(r'<script\b[^>]*>[\s\S]*?</script>', '', base)
m = re.search(r'(<style id="custom_css" type="text/css">)([\s\S]*?)(</style>)', base)
assert m
for css in glob.glob(os.path.join(d, "repo.*.css")):
    name = os.path.basename(css)[:-4]
    text = open(css, encoding="utf-8").read()
    html = base[:m.start(2)] + text + base[m.end(2):]
    open(os.path.join(d, "h-%s.html" % name), "w", encoding="utf-8", newline="\n").write(html)
    print("h-%s.html" % name)
