# Split a jam overview's style#jam_theme into itch's generated part and the host's CSS (never prints CSS).
# The generated part ends with the ".view_jam_page .jam_filter_picker .divider{...}" rule (corpus rule).
import re, sys
for f in sys.argv[1:]:
    b = open(f, 'rb').read()
    m = re.search(rb'<style\b[^>]*\bid="jam_theme"[^>]*>(.*?)</style>', b, re.S)
    s = m.group(1).decode('utf-8')
    k = s.find('.jam_filter_picker .divider')
    end = s.find('}', k) + 1
    gen, host = s[:end], s[end:]
    h = host[:-1] if host.endswith(' ') else host
    print(f"{f.split('/')[-1]:24} total={len(s)} generated={len(gen)} host_incl_space={len(host)} host={len(h)} host_bytes={len(h.encode())} "
          f"host_LF={h.count(chr(10))} host_CR={h.count(chr(13))} host_lead_ws={len(h)-len(h.lstrip())} ends_with_space={host.endswith(' ')} "
          f"braces_open={h.count('{')} braces_close={h.count('}')} host_if_CRLF={len(h)+h.count(chr(10))-h.count(chr(13))}")
