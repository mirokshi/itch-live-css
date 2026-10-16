# Gap 09-#40: raw UTF-8 vs \hex escapes. Writes two CSS files that differ only in how
# 10 non-ASCII characters are written, plus one file per character, into <outdir>.
# usage: python -I mk_size_fixtures.py <outdir>
import os, sys
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
chars = ["→", "★", "ñ", "¡", "é", "·", "…", "✓", "日", "\U0001F600"]
def esc(c):
    return "\\" + format(ord(c), "x")
raw = "".join(chars)
escd = "".join(esc(c) for c in chars)  # each escape ends at the next backslash or the quote: no space needed
tpl = '#wrapper .custom-x::before{content:"%s"}\n'
with open(os.path.join(out, "ten-raw.css"), "w", encoding="utf-8", newline="\n") as f:
    f.write(tpl % raw)
with open(os.path.join(out, "ten-esc.css"), "w", encoding="utf-8", newline="\n") as f:
    f.write(tpl % escd)
for i, c in enumerate(chars):
    for kind, s in (("raw", c), ("esc", esc(c))):
        with open(os.path.join(out, "c%02d-%s.css" % (i, kind)), "w", encoding="utf-8", newline="\n") as f:
            f.write(s + "\n")
print("raw :", ascii(tpl % raw))
print("esc :", ascii(tpl % escd))
