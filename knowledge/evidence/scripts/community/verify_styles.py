import sys, re
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    print('=====', p.split('/')[-1], 'len', len(s))
    print(' meta CSP:', re.findall(r'<meta[^>]*http-equiv="?Content-Security-Policy[^>]*>', s, re.I))
    for m in re.finditer(r'<style([^>]*)>(.*?)</style>', s, re.S):
        body = m.group(2)
        print(' STYLE', m.group(1).strip(), 'pos', m.start(), 'chars', len(body), 'u8', len(body.encode('utf-8')),
              'comments', len(re.findall(r'/\*.*?\*/', body, re.S)), 'newlines', body.count('\n'),
              '@import', body.count('@import'), 'amp', body.count('&'), 'entities', len(re.findall(r'&(gt|lt|amp|quot|#\d+);', body)),
              '!important', body.count('!important'))
        print('   head:', repr(body[:160]))
        print('   tail:', repr(body[-120:]))
    for m in re.finditer(r'<link[^>]*rel="stylesheet"[^>]*>', s):
        print(' LINK', m.group(0)[:220])
    for m in re.finditer(r'<script[^>]*src="([^"]+)"', s):
        print(' SCRIPT', m.group(1)[:120])
