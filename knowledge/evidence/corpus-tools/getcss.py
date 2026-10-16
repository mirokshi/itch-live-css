"""Extract the user-authored custom CSS from a saved itch.io page (raw bytes).

Profile / project / devlog pages: content of the <style> whose id is "custom_css".
  The element is simply absent when the page has no custom CSS.
Jam pages: there is no style#custom_css. itch appends the user's CSS INSIDE
  the <style> whose id is "jam_theme", right after the theme-editor output, whose
  last rule is always `.view_jam_page .jam_filter_picker .divider{color: #xxxxxx;}`,
  and then emits one space. So the tail after that rule is the user's CSS (+ " ").

ATTRIBUTE ORDER IS NOT STABLE (fixed in verification pass 2, 2026-10-14): itch
served `<style id="custom_css" type="text/css">` in the morning and
`<style type="text/css" id="custom_css">` in the afternoon of the same day. The
first version of this script required `id` first and reported NONE for every
page in the afternoon. The regexes below accept any attribute order.
The FIRST divider rule is used: the theme part always comes first, and a host
stylesheet that restyles the same selector would otherwise be cut short.

usage: python -I getcss.py page.html [...]  -> prints container + length per file
"""
import re

DIVIDER = b'.view_jam_page .jam_filter_picker .divider{'


def get(path):
    d = open(path, 'rb').read()
    m = re.search(rb'<style\b[^>]*\bid="custom_css"[^>]*>(.*?)</style>', d, re.S)
    if m:
        return ('custom_css', m.group(1))
    m = re.search(rb'<style\b[^>]*\bid="jam_theme"[^>]*>(.*?)</style>', d, re.S)
    if m:
        t = m.group(1); k = t.find(DIVIDER)
        if k < 0:
            return ('jam_theme?nodivider', t)
        return ('jam_theme_tail', t[t.index(b'}', k) + 1:])
    return None


if __name__ == '__main__':
    import sys, os
    sys.stdout.reconfigure(encoding='utf-8')
    for f in sys.argv[1:]:
        r = get(f); n = os.path.basename(f)
        print(n.ljust(55), 'NONE' if r is None else f'{r[0]:16} {len(r[1])}')
