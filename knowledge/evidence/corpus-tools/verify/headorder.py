# print the order of stylesheet-related elements in <head> (offsets) for raw itch pages
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
for f in sys.argv[1:]:
    d = open(f, 'rb').read()
    he = d.find(b'</head>')
    items = []
    for m in re.finditer(rb'<link[^>]*rel="stylesheet"[^>]*>|<style[^>]*>|<script[^>]*src="[^"]*"', d[:he] if he > 0 else d):
        tag = m.group(0)
        if tag.startswith(b'<style'):
            end = d.find(b'</style>', m.end())
            label = tag.decode() + f' [{end - m.end()} B]'
        elif tag.startswith(b'<link'):
            h = re.search(rb'href="([^"]+)"', tag).group(1).decode()
            label = 'link ' + h[:110]
        else:
            label = 'script ' + re.search(rb'src="([^"]+)"', tag).group(1).decode()[:60]
        items.append((m.start(), label))
    print('==', f.replace('\\', '/').split('/')[-1], 'head ends at', he)
    last = None
    for off, lab in items:
        if lab.startswith('script'):
            if last == 'script':
                continue
            last = 'script'
        else:
            last = lab
        print('  ', off, lab)
    # body-level stylesheets after </head>?
    after = re.findall(rb'<style[^>]*>|<link[^>]*rel="stylesheet"[^>]*>', d[he:]) if he > 0 else []
    print('   after </head>:', [a[:80] for a in after])
