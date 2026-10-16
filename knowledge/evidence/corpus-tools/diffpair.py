"""Compare a live custom CSS (extracted bytes) with its published source file.

usage: python -I diffpair.py live.css source.css [max_diff_lines]
Reports line endings, then whether the two are identical raw, after CRLF->LF,
and after CRLF->LF + strip(); prints a short unified diff otherwise.
"""
import sys, difflib
sys.stdout.reconfigure(encoding='utf-8')
live = open(sys.argv[1], 'rb').read(); src = open(sys.argv[2], 'rb').read()


def stats(b, name):
    crlf = b.count(b'\r\n')
    print(f"  {name}: bytes={len(b)} CRLF={crlf} LF-only={b.count(b'\n') - crlf} "
          f"BOM={b.startswith(b'\xef\xbb\xbf')} tail={b[-3:]!r} head={b[:3]!r}")


stats(live, 'live'); stats(src, 'src ')
L = live.decode('utf-8'); S = src.decode('utf-8-sig')
Ln = L.replace('\r\n', '\n'); Sn = S.replace('\r\n', '\n')
print('  identical raw:', live == src, '| after CRLF->LF:', Ln == Sn, '| after also strip():', Ln.strip() == Sn.strip())
if Ln.strip() != Sn.strip():
    d = list(difflib.unified_diff(Sn.strip().split('\n'), Ln.strip().split('\n'), 'src', 'live', n=0, lineterm=''))
    adds = sum(1 for x in d if x.startswith('+') and not x.startswith('+++'))
    dels = sum(1 for x in d if x.startswith('-') and not x.startswith('---'))
    print(f'  diff lines: +{adds} -{dels}')
    for x in d[:int(sys.argv[3]) if len(sys.argv) > 3 else 20]:
        print('   ', x[:160])
