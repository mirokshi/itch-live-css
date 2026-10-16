import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyze import summary
from cssparse import specificity, split_selectors
KEYS = ['#wrapper','.wrapper','.user_page_wrap','.user_page','.inner_column','.columns','.left_col','.right_col','.formatted_description','.user_profile','.user_links','.header','.game_grid_widget','.game_cell','.game_thumb','.game_title','a.title','.game_text','.buy_row','.button','.footer','.screenshot_list','.jam_page_wrap','.jam_body','.jam_content','.jam_header_widget','.jam_title_header','.post_body','.primary_column','a']
def last_compound(sel):
    sel = re.sub(r'::?[\w-]+(\([^)]*\))?', lambda m: m.group(0) if m.group(0).startswith(':not') else '', sel)
    parts = re.split(r'\s*[>+~]\s*|\s+', sel.strip())
    return parts[-1] if parts else ''
for path in sys.argv[1:]:
    s = summary(path)
    print('==', os.path.basename(path))
    for k in KEYS:
        best = None; cnt = 0; imp = 0
        for r in s['rules']:
            for sel in split_selectors(r['sel']):
                lc = last_compound(sel)
                if k == 'a':
                    ok = re.match(r'^a(\.|$|\[|:)', lc) is not None
                else:
                    ok = re.search(re.escape(k) + r'(?![\w-])', lc) is not None
                if ok:
                    cnt += 1
                    sp = specificity(sel)
                    if best is None or sp > best[0]: best = (sp, sel, ' / '.join(r['ctx']))
                    if any(i for p,v,i in r['decls']): imp += 1
        if cnt: print(f"  {k:24} rules={cnt:4} important={imp:2} max={best[0]} {best[1][:80]} {best[2]}")
