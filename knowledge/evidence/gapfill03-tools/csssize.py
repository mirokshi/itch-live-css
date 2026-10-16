"""Measure the creator CSS block of an itch page in three metrics, from the raw bytes (no newline translation).
usage: python -I csssize.py <file.html> [...]
Project/profile: content of style#custom_css. Jam: the part of style#jam_theme after the last char of the
first '.view_jam_page .jam_filter_picker .divider{...}' rule (host CSS + itch's appended space).
Prints: served bytes (UTF-8), code points as served (CRLF = 2), code points with CRLF->LF (CRLF = 1),
CRLF count, bare-LF count, length of data: URIs. Never prints the CSS itself."""
import sys, re

for f in sys.argv[1:]:
    raw = open(f, 'rb').read()
    t = raw.decode('utf-8', errors='replace')
    m = re.search(r'<style[^>]*\bid="custom_css"[^>]*>(.*?)</style>', t, re.S)
    kind = 'custom_css'
    if not m:
        j = re.search(r'<style[^>]*\bid="jam_theme"[^>]*>(.*?)</style>', t, re.S)
        if not j:
            print(f, 'NO CSS BLOCK'); continue
        body = j.group(1)
        d = body.find('.view_jam_page .jam_filter_picker .divider{')
        e = body.find('}', d) + 1 if d >= 0 else -1
        if e <= 0:
            print(f, 'jam_theme without divider rule'); continue
        css = body[e:]; kind = 'jam tail'
    else:
        css = m.group(1)
    b = len(css.encode('utf-8'))
    crlf = css.count('\r\n'); lf = css.count('\n') - crlf
    data = sum(len(x) for x in re.findall(r'data:[^)\'"]+', css))
    stripped = css.strip()
    print(f'{f.split("/")[-1].split(chr(92))[-1]}: {kind} bytes={b} chars={len(css)} chars_lf={len(css) - crlf} '
          f'chars_lf_stripped={len(stripped.replace(chr(13)+chr(10), chr(10)))} crlf={crlf} lf={lf} data_uri_chars={data} '
          f'non_ascii={sum(1 for c in css if ord(c) > 127)}')
