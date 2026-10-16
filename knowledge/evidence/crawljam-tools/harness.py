# usage: python -I harness.py <raw_overview.html> <out.html> <custom_css_file_or_-> 
# builds an offline copy of a jam overview: strips <script>, points jam.css to local copy, appends custom CSS to style#jam_theme
# (exactly where itch puts it) and adds a probe script that prints computed styles as RESULT {...}
import re,sys
src,out,cust=sys.argv[1:4]
h=open(src,encoding='utf8').read()
h=re.sub(r'<script\b[^>]*>.*?</script>','',h,flags=re.S)
# (fixed 2026-10-14 by the 2nd verifier: the ?version stamp changes several times a day and the
#  <style> attribute order varies between requests, so match both loosely)
h=re.sub(r'https://static\.itch\.io/jam\.css\?\d+','jam.css',h)
c='' if cust=='-' else open(cust,encoding='utf8').read()
h=re.sub(r'(<style[^>]*id="jam_theme"[^>]*>)(.*?)(</style>)',lambda m:m.group(1)+m.group(2)+c+m.group(3),h,count=1,flags=re.S)
probe=open(sys.argv[0].replace('harness.py','probe.js'),encoding='utf8').read()
h=h.replace('</body>','<pre id="probe_out"></pre><script>'+probe+'</script></body>')
open(out,'w',encoding='utf8').write(h)
