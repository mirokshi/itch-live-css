import sys, re, html
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
styles = re.findall(r'<style([^>]*)>(.*?)</style>', s, re.S)
for attrs, body in styles:
    print('STYLE', attrs.strip(), 'chars=', len(body), 'utf8bytes=', len(body.encode('utf-8')))
links = re.findall(r'<link[^>]*rel="stylesheet"[^>]*>', s)
for l in links: print('LINK', l[:200])
m = re.search(r'<style[^>]*id="custom_css"[^>]*>(.*?)</style>', s, re.S)
if m:
    css = m.group(1)
    print('custom_css head:', css[:300].replace('\n','\n'))
    print('has @import:', css.count('@import'), ' has nesting &:', css.count('&'), ' !important:', css.count('!important'))
    print('html-escaped entities present:', bool(re.search(r'&(gt|lt|amp|quot);', css)))
    if len(sys.argv) > 2:
        ref = open(sys.argv[2], encoding='utf-8').read()
        print('identical to ref:', css == ref, 'ref len', len(ref))
        if css != ref:
            import difflib
            for i,(a,b) in enumerate(zip(css, ref)):
                if a!=b:
                    print('first diff at', i, repr(css[i-40:i+60]), '|||', repr(ref[i-40:i+60])); break
# classes in profile
prof = re.search(r'class="user_profile formatted"(.*?)</div>\s*</div>\s*<div class="column game_column', s, re.S)
seg = s[s.find('user_profile'):] if 'user_profile' in s else ''
cls = re.findall(r'class="([^"]*)"', seg[:20000])
from collections import Counter
print('classes after user_profile (first 20k chars):', Counter(c for cl in cls for c in cl.split()).most_common(40))
print('style attrs in user_profile segment:', len(re.findall(r' style="', seg[:20000])))
