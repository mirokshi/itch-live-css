import re, sys, collections, html
raw = sys.argv[1]; itchdir = sys.argv[2]
def strip_comments(s): return re.sub(r'/\*.*?\*/', '', s, flags=re.S)
def top_rules(css):
    """yield (prelude, body) for top-level and @media-nested style rules (simple brace walker)."""
    out=[]; i=0; n=len(css)
    def walk(s, ctx):
        i=0; n=len(s)
        while i<n:
            j=s.find('{', i)
            if j<0: break
            pre=s[i:j].strip()
            # skip statements ending with ; before the {
            if ';' in pre: pre=pre.split(';')[-1].strip()
            depth=1; k=j+1
            while k<n and depth:
                if s[k]=='{': depth+=1
                elif s[k]=='}': depth-=1
                k+=1
            body=s[j+1:k-1]
            if pre.startswith('@media') or pre.startswith('@supports') or pre.startswith('@layer'):
                walk(body, ctx+[pre])
            else:
                out.append((pre, body, tuple(ctx)))
            i=k
    walk(css, [])
    return out
def classes_in(sel): return set(re.findall(r'\.(-?[_a-zA-Z][\w-]*)', sel))
def analyze(name, path):
    css=strip_comments(open(path, encoding='utf-8').read())
    rules=top_rules(css)
    style=[r for r in rules if not r[0].startswith('@')]
    kf=[r[0].split()[1] for r in rules if r[0].startswith('@keyframes')]
    ff=[r for r in rules if r[0].startswith('@font-face')]
    sels=[s.strip() for r in style for s in r[0].split(',')]
    glob=[s for s in sels if not re.search(r'[.#]', s)]   # no class/id: element, :root, *, [attr], ::pseudo
    gkind=collections.Counter()
    for s in glob:
        head=re.split(r'[\s>+~]', s)[0]
        gkind[re.sub(r'[:\[].*','',head) or head[:12]]+=1
    imp=css.count('!important')
    cls=set().union(*[classes_in(s) for s in sels]) if sels else set()
    print(f'== {name}: bytes={len(open(path,"rb").read())} style_rules={len(style)} selectors={len(sels)} '
          f'global_selectors(no class/id)={len(glob)} !important={imp} @keyframes={len(kf)} @font-face={len(ff)} '
          f'@layer={css.count("@layer")} @import={css.count("@import")} classes={len(cls)}')
    print('   global selector heads (top 25):', gkind.most_common(25))
    print('   sample global selectors:', glob[:25])
    print('   rules with :root or [data-bs-theme]:', sum(1 for s in sels if s.startswith(':root') or s.startswith('[data-bs-theme')))
    print('   prefers-reduced-motion blocks:', css.count('prefers-reduced-motion'))
    return cls, kf
fw={}
fw['bootstrap']=analyze('bootstrap 5.3.3 min', raw+'/bootstrap_5.3.3_dist_css_bootstrap.min.css')
fw['animate']=analyze('animate.css 4.1.1 min', raw+'/animate.css_4.1.1_animate.min.css')
fw['twpre']=analyze('tailwind 4.1.13 preflight.css', raw+'/tailwindcss_4.1.13_preflight.css')
print('animate keyframes (first 30):', fw['animate'][1][:30], 'total', len(fw['animate'][1]))
print('animate class prefixes:', collections.Counter(c.split('__')[0] for c in fw['animate'][0]).most_common(5))
# itch: classes in user.css + in real page HTML
ucss=strip_comments(open(itchdir+'/external-verify/raw/usercss.css',encoding='utf-8').read())
ur=top_rules(ucss)
ucls=set().union(*[classes_in(s) for r in ur if not r[0].startswith('@') for s in r[0].split(',')])
ukf=[r[0].split()[1] for r in ur if r[0].startswith('@keyframes')]
print('itch user.css: classes', len(ucls), 'keyframes', ukf)
pages={'profile':itchdir+'/external/mirokshi.html','project':itchdir+'/crawlproject/raw/c-game-34.html','devlog':itchdir+'/crawlproject/raw/d-ashorthike-post.html'}
hcls=set()
for k,p in pages.items():
    h=open(p,encoding='utf-8',errors='replace').read()
    c=set()
    for m in re.findall(r'class="([^"]*)"', h): c|=set(m.split())
    print(f'{k} page classes:', len(c))
    hcls|=c
itch=ucls|hcls
for k in ('bootstrap','animate'):
    inter=sorted(fw[k][0] & itch)
    print(f'{k} classes also used by itch (user.css or page HTML): {len(inter)}:', inter[:80])
    print(f'{k} keyframes colliding with itch user.css keyframes:', sorted(set(fw[k][1]) & set(ukf)))
