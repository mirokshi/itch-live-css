import re, sys
sys.stdout.reconfigure(encoding='utf-8')
for f in sys.argv[1:]:
    d = open(f, 'rb').read()
    ms = list(re.finditer(rb'<style([^>]*)>(.*?)</style>', d, re.S))
    jt = [m.group(2) for m in ms if b'id="jam_theme"' in m.group(1)]
    cc = [m for m in ms if b'id="custom_css"' in m.group(1)]
    if not jt: print(f, 'NO jam_theme'); continue
    t = jt[0]
    # split theme vs tail: last occurrence of the divider rule
    k = t.rfind(b'.jam_filter_picker .divider{')
    end = t.index(b'}', k) + 1 if k >= 0 else -1
    theme, tail = t[:end], t[end:]
    rules_in_theme = theme.count(b'}')
    first = theme[:28]
    print(f"{f:34} theme={len(theme):5}B tail={len(tail):6}B chars={len(tail.decode('utf-8')):6} start={first!r} tailEnd={tail[-3:]!r} tailStart={tail[:40]!r} custom_css={len(cc)} crlf={tail.count(b'\r\n')} lf={tail.count(b'\n')}")
