# usage: python -I mk.py <raw overview.html> <out.html> <css file|-> <probe.js>  (appends the CSS inside style#jam_theme, where itch appends host CSS; jam.css must be copied to tests/jam.css)
# usage: python -I mk.py <overview.html> <out.html> <css-file|-> <probe.js>
import re,sys
src,out,cust,probe=sys.argv[1:5]
h=open(src,encoding='utf8').read()
h=re.sub(r'<script\b[^>]*>.*?</script>','',h,flags=re.S)
h=re.sub(r'https://static\.itch\.io/jam\.css\?\d+','jam.css',h)
c='' if cust=='-' else open(cust,encoding='utf8').read()
h,n=re.subn(r'(<style[^>]*id="jam_theme"[^>]*>)(.*?)(</style>)',lambda m:m.group(1)+m.group(2)+c+m.group(3),h,count=1,flags=re.S)
assert n==1
p=open(probe,encoding='utf8').read()
h=h.replace('</body>','<pre id="vout"></pre><script>'+p+'</script></body>')
open(out,'w',encoding='utf8').write(h)
