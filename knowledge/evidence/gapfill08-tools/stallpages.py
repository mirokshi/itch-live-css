"""Generate the stall-lab pages (gapfill-08, 2026-10-14). usage: python -I stallpages.py <pages_dir>
Each page mirrors itch's shape: <style id="custom_css"> in <head> whose first line is the @import under test,
a #wrapper body, and an inline script at the end of <body> (itch runs its init code there)."""
import os, sys
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
VARIANTS = {
    's0-none': None,
    's1-blackhole-https': 'https://10.255.255.1/x.css',      # private address, no host answers -> SYN timeout
    's1b-blackhole-http': 'http://10.255.255.1/x.css',
    's1c-testnet-https': 'https://192.0.2.1/x.css',          # TEST-NET-1 (RFC 5737), never routed
    's2-nxdomain': 'https://nonexistent-host.invalid/x.css',  # .invalid never resolves (RFC 2606)
    's3-accept-hang-http': 'http://127.0.0.1:8812/x.css',     # TCP accepted, request never answered
    's3b-accept-hang-https': 'https://127.0.0.1:8812/x.css',  # TCP accepted, TLS handshake never answered
    's4-headers-then-stall': 'http://127.0.0.1:8813/x.css',  # 200 + headers + first chunk, then body stalls
    's5-slow-ok-2500': 'http://127.0.0.1:8814/x.css',        # control: complete answer after 2.5 s
    's6-refused': 'http://127.0.0.1:8819/x.css',             # control: nothing listening
}
TPL = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{name}</title>'
       '<style type="text/css" id="custom_css">{imp}#wrapper p{{color:rgb(1,2,3)}}</style></head>'
       '<body><div id="wrapper" class="user_page_wrap"><div class="user_page"><p>itch-like content</p></div></div>'
       '<script>window.__endScript=performance.now();</script></body></html>')
for name, url in VARIANTS.items():
    imp = f'@import url("{url}");' if url else ''
    open(os.path.join(out, name + '.html'), 'w', encoding='utf-8').write(TPL.format(name=name, imp=imp))
print(' '.join(VARIANTS))
