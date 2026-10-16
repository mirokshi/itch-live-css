import re, html, sys, difflib
online_path, offline_path = sys.argv[1], sys.argv[2]
s = open(online_path, encoding='utf-8').read()
a = s.find('<div class="ssi_content">'); b = s.find('<p class="social_nag">')
body = s[a:b]
def norm(t):
    t = re.sub(r'<pre.*?</pre>', lambda m: ' CODEBLOCK '+re.sub(r'<[^>]+>','',m.group(0))+' ', t, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = html.unescape(t)
    t = t.replace('\u2019',"'").replace('\u2018',"'")
    t = re.sub(r'[`*#\-]+', ' ', t)
    t = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t
on = norm(body)
off_raw = open(offline_path, encoding='utf-8').read()
off_raw = re.sub(r'```', ' CODEBLOCK ', off_raw, count=1)
off_raw = off_raw.replace('```','')
off = norm(off_raw)
ow = on.split(' '); fw = off.split(' ')
sm = difflib.SequenceMatcher(None, fw, ow, autojunk=False)
print('ratio', round(sm.ratio(),4), 'offline words', len(fw), 'online words', len(ow))
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op != 'equal':
        print(op.upper(), '| OFFLINE:', ' '.join(fw[i1:i2])[:400], '| ONLINE:', ' '.join(ow[j1:j2])[:1200])
