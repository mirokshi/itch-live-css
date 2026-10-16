"""Build local test harnesses for the s04 gap-fill (focus block + maximized game frame).

usage: python -I build_pages.py <SCRATCH>      (SCRATCH = the session scratchpad root)

Inputs (logged-out copies fetched earlier in this session, no new itch requests):
  section04/raw/profile_leafo.html      profile with collection carousels  (user.css)
  crawljam/raw/ov_bubblejam.html        jam overview with an entries grid  (jam.css), host CSS empty
  docs-verify2/raw/igua.html            HTML5 project, "launch in fullscreen" (game.css)
  section04/raw/{user,game,jam}.css     itch bundles, build ?1791981660 (md5 2a073ae4 / c97fee7b / 49c29ed1)
  community-verify2/static/{bundle,game}.min.js, itchcss-v2/raw/lib.min.js   itch runtime scripts

Outputs in gapfill-s04/pages/:
  focus_profile.html, focus_jam.html, focus_project.html   scripts stripped, creator CSS emptied,
      bundle linked locally, + one test <style id="fix"> after the theme (the custom_css slot).
      Jam + project pages get a synthetic <span class="spoiler" tabindex="0"> (itch's editor markup, crawljam-32);
      the project page also gets a synthetic <a class="button disabled"> (itch sets .button.disabled:focus{outline:0}).
  fake_game.html      local stand-in for the blocked game iframe: red border, stripes, prints its viewport size.
  game_project.html   igua with itch's real scripts kept (rewritten to local copies) so the real
      HtmlEmbed click -> enter_maximized() path runs; creator CSS emptied; analytics script removed.
"""
import os, re, sys, shutil

SP = sys.argv[1]
OUT = os.path.join(SP, 'gapfill-s04', 'pages')
os.makedirs(OUT, exist_ok=True)
for name, src in [('user.css', 'section04/raw/user.css'), ('game.css', 'section04/raw/game.css'),
                  ('jam.css', 'section04/raw/jam.css'), ('bundle.min.js', 'community-verify2/static/bundle.min.js'),
                  ('game.min.js', 'community-verify2/static/game.min.js'), ('lib.min.js', 'itchcss-v2/raw/lib.min.js')]:
    shutil.copyfile(os.path.join(SP, src), os.path.join(OUT, name))

def read(p): return open(os.path.join(SP, p), encoding='utf-8').read()

def common(s, bundle):
    s = re.sub(r'<link[^>]*href="https://static\.itch\.io/(user|game|jam)\.css[^"]*"[^>]*>',
               f'<link rel="stylesheet" href="{bundle}"/>', s)
    s = re.sub(r'<meta name="csrf_token"[^>]*>', '', s)
    return s

def strip_scripts(s):
    return re.sub(r'<script\b.*?</script>', '', s, flags=re.S)

def empty_custom(s):
    # profile / project: creator CSS lives in style#custom_css -> keep the element (cascade slot) but empty it
    return re.sub(r'(<style[^>]*id="custom_css"[^>]*>).*?(</style>)', r'\1\2', s, flags=re.S)

FIX = '<style id="fix"></style>'

# profile
s = common(read('section04/raw/profile_leafo.html'), 'user.css')
s = strip_scripts(empty_custom(s))
s = s.replace('</head>', FIX + '</head>', 1)
open(os.path.join(OUT, 'focus_profile.html'), 'w', encoding='utf-8').write(s)

# jam overview: host CSS would be appended inside style#jam_theme; bubblejam's host part is empty (whitespace)
s = common(read('crawljam/raw/ov_bubblejam.html'), 'jam.css')
s = strip_scripts(s)
s = s.replace('</head>', FIX + '</head>', 1)
s = s.replace('class="jam_content user_formatted">', 'class="jam_content user_formatted"><p id="t_spoiler_p">Spoiler test: '
              '<span class="spoiler" tabindex="0">hidden ending</span></p>', 1)
open(os.path.join(OUT, 'focus_jam.html'), 'w', encoding='utf-8').write(s)

# project (static) for links / buttons / spoiler
s = common(read('docs-verify2/raw/igua.html'), 'game.css')
s = strip_scripts(empty_custom(s))
s = s.replace('</head>', FIX + '</head>', 1)
s = s.replace('class="formatted_description user_formatted"><div>', 'class="formatted_description user_formatted"><div>'
              '<p id="t_spoiler_p">Spoiler test: <span class="spoiler" tabindex="0">hidden ending</span> '
              '<a class="button disabled" href="#t_disabled" id="t_disabled">Disabled button</a></p>', 1)
open(os.path.join(OUT, 'focus_project.html'), 'w', encoding='utf-8').write(s)

# project with itch's runtime (maximize test)
s = common(read('docs-verify2/raw/igua.html'), 'game.css')
s = empty_custom(s)
s = re.sub(r'src="https://static\.itch\.io/(lib|bundle|game)\.min\.js[^"]*"', r'src="\1.min.js"', s)
s = re.sub(r'<script[^>]*src="https://static\.itch\.io/lib/jquery\.maskMoney\.js"[^>]*></script>', '', s)
s = re.sub(r'<script type="text/javascript">\s*if \(!window\.location\.hostname.*?</script>', '', s, flags=re.S)
# the game iframe (data-iframe attribute, HTML-escaped) -> a local stand-in that paints a frame and prints its own
# viewport size, so screenshots show what the game would get
s = re.sub(r'src=&quot;https://html-classic\.itch\.zone/[^&]*&quot;', 'src=&quot;fake_game.html&quot;', s)
s = s.replace('</head>', FIX + '</head>', 1)
open(os.path.join(OUT, 'game_project.html'), 'w', encoding='utf-8').write(s)
open(os.path.join(OUT, 'fake_game.html'), 'w', encoding='utf-8').write(
    '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%}body{box-sizing:border-box;border:12px solid #e33;'
    'background:repeating-linear-gradient(45deg,#234 0 20px,#345 20px 40px);color:#fff;font:bold 48px sans-serif;'
    'display:grid;place-items:center}</style><body><div id="s"></div><script>const f=()=>s.textContent=innerWidth+"x"+innerHeight;'
    'f();addEventListener("resize",f)</script>')
print('ok', sorted(os.listdir(OUT)))
