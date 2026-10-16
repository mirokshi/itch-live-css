"""Build step for the itch.io live probe kit (kit v1, 2026-10-14).

  python -I build.py            (run from any directory; paths are relative to this file)

1. Writes probe-bio.html: the subset of probe-description.html (selected by probe id) that fits a
   profile bio, whose HTML is reportedly capped at about 5,000 characters.
2. Embeds exact copies of probe.css, probe-description.html and probe-bio.html into check.js,
   between /*EMBED-START*/ and /*EMBED-END*/, so check.js can diff what was sent against what itch
   serves.
3. Prints sizes and fails if a payload breaks a budget or a probe id repeats.

Edit the payload files, then re-run this script. Never edit the embedded copies by hand.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
P = lambda name: os.path.join(HERE, name)  # noqa: E731

# Probes that also go into the bio subset: the questions that are asked about bios specifically
# (class tokens, ARIA and id, inline style, details attributes, link tags, the letter-split h1,
# iframes and click-to-activate, rel=me, spoilers, editor normalisation, comments).
BIO = """x00 k01 k05 k07 k09 k11 k14 k16 k26 k31 k34 a01 a02 a04 a05 a09 a12 a20
s02 s08 s11 s18 t08 t21 t23 i01 i04 l01 l02 l10 g07 e04 x99""".split()

CSS_BUDGET = 5000   # probe.css must fit the profile editor (cap believed to be 5,120)
BIO_BUDGET = 4000   # bio HTML is reportedly capped at 5,000; itch may add ~1,000 (placeholders, rel, loading)


def read(name):
    with open(P(name), encoding="utf-8", newline="") as f:
        return f.read()


def write(name, text):
    with open(P(name), "w", encoding="utf-8", newline="") as f:
        f.write(text)


def split_probes(html):
    """[(id, text)] in order; a line without a probe class continues the previous probe."""
    out = []
    for line in html.split("\n"):
        if not line:
            continue
        m = re.search(r'custom-probe-([a-z]\d\d)\b', line)
        if m:
            out.append([m.group(1), line])
        elif out:
            out[-1][1] += "\n" + line
        else:
            sys.exit("build.py: text before the first probe: " + line[:60])
    return out


def main():
    css = read("probe.css")
    full = read("probe-description.html")
    if "\r" in css or "\r" in full:
        sys.exit("build.py: payloads must use LF line endings")
    probes = split_probes(full)
    ids = [i for i, _ in probes]
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        sys.exit("build.py: duplicate probe ids: " + " ".join(dup))
    missing = [i for i in BIO if i not in ids]
    if missing:
        sys.exit("build.py: BIO lists unknown ids: " + " ".join(missing))
    bio = "\n".join(t for i, t in probes if i in BIO) + "\n"
    bio = bio.replace("PROBE-HTML-START set=full", "PROBE-HTML-START set=bio", 1)
    write("probe-bio.html", bio)

    embed = json.dumps({"css": css, "html": {"full": full, "bio": bio}}, ensure_ascii=True)
    js = read("check.js")
    new, n = re.subn(r"/\*EMBED-START\*/.*?/\*EMBED-END\*/", lambda m: "/*EMBED-START*/" + embed + "/*EMBED-END*/", js, flags=re.S)
    if n != 1:
        sys.exit("build.py: EMBED markers not found exactly once in check.js")
    write("check.js", new)

    def size(label, s):
        print(f"{label:24} {len(s):6} chars {len(s.encode('utf-8')):6} UTF-8 bytes {s.count(chr(10)):4} LF")

    size("probe.css", css)
    size("probe-description.html", full)
    size("probe-bio.html", bio)
    size("check.js", new)
    print(f"probes: {len(ids)} in the full set, {len(BIO)} in the bio set")
    if len(css) > CSS_BUDGET or len(css.encode('utf-8')) > CSS_BUDGET:
        sys.exit(f"build.py: probe.css is over {CSS_BUDGET}")
    if len(bio) > BIO_BUDGET:
        sys.exit(f"build.py: probe-bio.html is over {BIO_BUDGET}")


if __name__ == "__main__":
    main()
