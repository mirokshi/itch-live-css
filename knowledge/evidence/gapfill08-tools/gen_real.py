"""Real-page harness generator (gapfill-08, 2026-10-14).
usage: python -I gen_real.py <src_dir with profile.html, project.html> <www/pages dir>
Takes same-day copies of a live itch profile and project page and writes one page per framework variant:
- https://static.itch.io/... -> /static/... (local copies of itch's own JS/CSS, so itch's scripts run)
- every @import in style#custom_css is removed (no external requests); the variant's @import is put first
- a fixed bio fragment (sanitizer-compatible custom-* tokens, plus Tailwind v4 'custom:' tokens) is injected
  at the start of the bio (.user_profile) / description (.formatted_description).
Pages are local test copies only; they are never published.
"""
import os, re, sys
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
FRAG = ('<div class="custom-lab-bs custom-bs"><a class="custom-lab-btn custom-btn custom-btn-primary" href="https://example.com/">Btn</a> '
        '<span class="custom-badge custom-text-bg-danger">b</span><div class="custom-row"><div class="custom-col-6">c1</div>'
        '<div class="custom-col-6">c2</div></div><div class="custom-lab-spinner custom-spinner-border"></div>'
        '<p class="custom-lab-small custom-text-center custom-small">s</p><h2 class="custom-lab-h2">h2</h2></div>'
        '<div class="custom-tw"><p class="custom-lab-tw3 custom-flex custom-rotate-3 custom-w-[37px] custom-shadow-lg custom-blur-sm ' 'custom-text-red-500">tw3</p><p class="custom-lab-tw3b custom-animate-bounce">b3</p>'
        '<p class="custom-lab-tw4 custom:flex custom:rotate-3 custom:w-[37px] custom:shadow-lg custom:blur-sm custom:text-red-500">tw4</p><p class="custom-lab-tw4b custom:animate-bounce">b4</p></div>')
VARIANTS = ['none', 'bs-asis', 'bs-wrapper', 'bs-bio', 'tw3-out-full', 'tw3-out-util', 'tw3-recipe', 'tw4-b-theme-util', 'tw4-recipe']
for page in ('profile', 'project'):
    html = open(os.path.join(src, page + '.html'), encoding='utf-8').read()
    html = html.replace('https://static.itch.io/', '/static/')
    m = re.search(r'(<style[^>]*id="custom_css"[^>]*>)(.*?)(</style>)', html, flags=re.S)
    assert m, page
    own = re.sub(r'''@import\s+(?:url\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\s*\)|"[^"]*"|'[^']*')[^;]*;''', '', m.group(2))
    assert '@import' not in own, page
    bio_open = re.search(r'<div class="(user_profile formatted|formatted_description user_formatted)"[^>]*>', html)
    assert bio_open, page
    for v in VARIANTS:
        imp = '' if v == 'none' else f'@import url("/css/{v}.css");'
        h = html[:m.start()] + m.group(1) + imp + own + m.group(3) + html[m.end():]
        b = re.search(r'<div class="(user_profile formatted|formatted_description user_formatted)"[^>]*>', h)
        h = h[:b.end()] + FRAG + h[b.end():]
        # probe for global keyframe clashes: itch's own .animate_bounce class (user.css/game.css), outside #wrapper
        bo = re.search(r'<body[^>]*>', h)
        h = h[:bo.end()] + '<div class="animate_bounce" id="lab_bounce">itch bounce probe</div>' + h[bo.end():]
        open(os.path.join(out, f'{page}-{v}.html'), 'w', encoding='utf-8').write(h)
    print(page, 'own custom css chars (imports removed):', len(own), 'variants:', len(VARIANTS))
