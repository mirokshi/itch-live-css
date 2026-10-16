# Print size stats of itch custom CSS blocks (never prints CSS text).
# usage: python -I blockstats.py page.html [...]
#   profile/project/devlog: content of <style ... id="custom_css" ...>
#   jam overview: content of <style ... id="jam_theme" ...> (generated + host + " ")
import re, sys, hashlib
for f in sys.argv[1:]:
    b = open(f, 'rb').read()
    for bid in ('custom_css', 'jam_theme', 'game_theme', 'user_theme'):
        m = re.search(rb'<style\b[^>]*\bid="' + bid.encode() + rb'"[^>]*>(.*?)</style>', b, re.S)
        if not m: continue
        raw = m.group(1); s = raw.decode('utf-8')
        u16 = len(s.encode('utf-16-le')) // 2
        print(f"{f.split('/')[-1]:28} {bid:11} bytes={len(raw):6} chars={len(s):6} utf16={u16:6} CR={raw.count(b'\r'):4} LF={raw.count(b'\n'):4} "
              f"chars_LFnorm={len(s.replace(chr(13)+chr(10), chr(10))):6} sha1={hashlib.sha1(raw).hexdigest()[:12]}")
