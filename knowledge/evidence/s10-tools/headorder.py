# Print the order of stylesheet-related elements in <head> (link rel=stylesheet, style#id, script count) + body/wrapper classes. Never prints CSS.
import re,sys
for f in sys.argv[1:]:
    h=open(f,encoding='utf8',errors='replace').read()
    head=h.split('</head>')[0]
    items=[]
    for m in re.finditer(r'<link[^>]*rel="stylesheet"[^>]*>|<style[^>]*>|<script\b',head):
        t=m.group(0)
        if t.startswith('<link'):
            href=re.search(r'href="([^"]+)"',t); items.append('link '+re.sub(r'\?.*','',href.group(1)).split('/')[-1] if href else 'link ?')
        elif t.startswith('<style'):
            i=re.search(r'id="([^"]+)"',t); items.append('style#'+(i.group(1) if i else '-'))
        else: items.append('script')
    # collapse consecutive scripts
    out=[]
    for x in items:
        if out and x=='script' and out[-1].startswith('script'):
            n=int(out[-1].split('x')[1]) if 'x' in out[-1] else 1; out[-1]='script x%d'%(n+1)
        else: out.append(x)
    body=re.search(r'<body[^>]*class="([^"]*)"',h); wrap=re.search(r'<div[^>]*id="wrapper"[^>]*>',h)
    vp=re.search(r'<meta[^>]*name="viewport"[^>]*>',h)
    print(f.split('/')[-1],'|',' -> '.join(out))
    print('   body:',body.group(1) if body else '-','| wrapper:',wrap.group(0)[:90] if wrap else '-','| viewport:',bool(vp),'| h1s:',len(re.findall(r'<h1\b',h)))
