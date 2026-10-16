"""minify.py <in.css> <out.css> - small string-aware CSS minifier for itch's CSS box.
Removes comments, collapses whitespace, drops spaces around { } ; , and after ':' and before '!',
and the last ';' of a block. It never removes a space BEFORE ':' (that would turn '#wrapper ::selection'
into '#wrapper::selection') and never touches '+', '-', '(' or ')' (calc() and '@media ... and (' need them).
Strings ('...' and "...") are copied verbatim. Prove the result with cssom-equal.mjs."""
import sys

src = open(sys.argv[1], encoding='utf-8').read()
out, i, n = [], 0, len(src)
BACKSLASH = chr(92)
while i < n:
    c = src[i]
    if c in '"\'':
        j = i + 1
        while j < n and src[j] != c:
            j += 2 if src[j] == BACKSLASH else 1
        out.append(src[i:j + 1])
        i = j + 1
        continue
    if src.startswith('/*', i):
        j = src.find('*/', i + 2)
        i = n if j < 0 else j + 2
        continue
    if c.isspace():
        while i < n and src[i].isspace():
            i += 1
        prev = out[-1][-1] if out and out[-1] else ''
        nxt = src[i] if i < n else ''
        if prev in '{};,:' or nxt in '{};,!' or prev == '' or nxt == '':
            continue
        out.append(' ')
        continue
    if c == '}' and out and out[-1] == ';':
        out.pop()
    out.append(c)
    i += 1
s = ''.join(out).strip()
open(sys.argv[2], 'w', encoding='utf-8', newline='\n').write(s)
print(len(s), 'chars', len(s.encode('utf-8')), 'UTF-8 bytes', sys.argv[2])
