import sys,zlib,struct
def read(p):
    d=open(p,'rb').read(); assert d[:8]==b'\x89PNG\r\n\x1a\n'; i=8; idat=b''
    while i<len(d):
        n,=struct.unpack('>I',d[i:i+4]); t=d[i+4:i+8]; c=d[i+8:i+8+n]; i+=12+n
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',c[:10])
        elif t==b'IDAT': idat+=c
    raw=zlib.decompress(idat); bpp={2:3,6:4}[ct]; stride=w*bpp; rows=[]; prev=bytearray(stride); o=0
    for y in range(h):
        f=raw[o]; o+=1; line=bytearray(raw[o:o+stride]); o+=stride
        for x in range(stride):
            a=line[x-bpp] if x>=bpp else 0; b=prev[x]; c=prev[x-bpp] if x>=bpp else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                pa,pb,pc=abs(b-c),abs(a-c),abs(a+b-2*c); pr=a if pa<=pb and pa<=pc else (b if pb<=pc else c); line[x]=(line[x]+pr)&255
        rows.append(line); prev=line
    return w,h,rows,bpp
w,h,rows,bpp=read(sys.argv[1])
for (x,y) in [(10,10),(100,100),(250,250)]:
    print(sys.argv[1].split('/')[-1],(x,y),tuple(rows[y][x*bpp:x*bpp+3]))
