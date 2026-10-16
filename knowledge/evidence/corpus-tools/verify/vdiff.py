import sys
live = open(sys.argv[1],'rb').read(); src = open(sys.argv[2],'rb').read()
def st(b): c=b.count(b'\r\n'); return f'bytes={len(b)} CRLF={c} bareLF={b.count(b"\n")-c} head={b[:2]!r} tail={b[-4:]!r}'
print(' live', st(live)); print(' src ', st(src))
print(' raw equal:', live==src)
Ln=live.replace(b'\r\n',b'\n'); Sn=src.replace(b'\r\n',b'\n')
print(' LF-normalised equal:', Ln==Sn, '| +strip equal:', Ln.strip()==Sn.strip())
if Ln.strip()!=Sn.strip():
    import difflib
    a=Sn.strip().decode('utf-8','replace').split('\n'); b=Ln.strip().decode('utf-8','replace').split('\n')
    d=[x for x in difflib.unified_diff(a,b,'src','live',n=0,lineterm='')]
    print(' diff lines', len(d)); [print('   ',x[:150]) for x in d[:12]]
