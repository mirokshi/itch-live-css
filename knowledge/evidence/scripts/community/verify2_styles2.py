"""List every <style> block of a saved itch page: id, length, position (head/body),
first 80 chars, number of comments, @import lines, '&' count, html entities.
Usage: python -I -X utf8 styles2.py page.html [--dump DIR]
"""
import re, sys, os

path = sys.argv[1]
dump = sys.argv[sys.argv.index('--dump') + 1] if '--dump' in sys.argv else None
html = open(path, encoding='utf-8').read()
head_end = html.find('</head>')
print(f'file={os.path.basename(path)} len={len(html)} head_end={head_end}')
for m in re.finditer(r'<style([^>]*)>(.*?)</style>', html, re.S):
    attrs, body = m.group(1), m.group(2)
    sid = re.search(r'id="([^"]*)"', attrs)
    sid = sid.group(1) if sid else '(no id)'
    where = 'head' if m.start() < head_end else 'body'
    comments = len(re.findall(r'/\*.*?\*/', body, re.S))
    imports = re.findall(r'@import[^;]*;', body)
    amp = body.count('&')
    ents = re.findall(r'&(?:gt|lt|amp|quot|#\d+);', body)
    print(f'  style#{sid} [{where}] chars={len(body)} utf8={len(body.encode())} comments={comments} '
          f'newlines={body.count(chr(10))} imports={len(imports)} amp={amp} entities={len(ents)}')
    print('    start:', repr(body[:90]))
    for i in imports:
        print('    import:', i[:140])
    if dump:
        os.makedirs(dump, exist_ok=True)
        open(os.path.join(dump, f'{os.path.basename(path)}.{sid}.css'), 'w', encoding='utf-8', newline='').write(body)
# CSP meta?
print('  meta CSP:', bool(re.search(r'http-equiv="Content-Security-Policy"', html, re.I)))
