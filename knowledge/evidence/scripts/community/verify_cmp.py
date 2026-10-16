import sys, re
page, ref = sys.argv[1], sys.argv[2]
s = open(page, encoding='utf-8').read()
css = re.search(r'<style[^>]*id="custom_css"[^>]*>(.*?)</style>', s, re.S).group(1)
r = open(ref, encoding='utf-8', newline='').read()
print('served', len(css), 'ref', len(r), 'identical', css == r, 'identical after rstrip', css == r.rstrip(), 'ref ends', repr(r[-5:]))
if css != r.rstrip():
    for i,(a,b) in enumerate(zip(css, r)):
        if a != b:
            print('first diff', i, repr(css[i-30:i+40]), '|', repr(r[i-30:i+40])); break
