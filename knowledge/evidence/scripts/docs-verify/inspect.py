import sys, re, hashlib
sys.stdout.reconfigure(encoding="utf-8")
# usage: inspect.py page.html -- style blocks, #wrapper tag, documented selectors, page_name, var declarations
s=open(sys.argv[1],encoding='utf-8',errors='replace').read()
print('FILE',sys.argv[1].split('/')[-1], 'len',len(s))
m=re.search(r'data-page_name="([^"]+)"',s); print(' page_name:', m.group(1) if m else None)
m=re.search(r'<body[^>]*>',s); print(' body:', m.group(0)[:200] if m else None)
for st in re.finditer(r'<style([^>]*)>(.*?)</style>',s,re.S):
    attrs=st.group(1); css=st.group(2)
    idm=re.search(r'id="([^"]+)"',attrs)
    print(' STYLE id=%s chars=%d sha1=%s  #wrapper×%d @import×%d !important×%d @media×%d data:×%d'%(idm.group(1) if idm else None,len(css),hashlib.sha1(css.encode('utf-8')).hexdigest()[:12],css.count('#wrapper'),css.count('@import'),css.count('!important'),css.count('@media'),css.count('data:')))
m=re.search(r'<[a-z]+[^>]*\bid="wrapper"[^>]*>',s); print(' #wrapper tag:', m.group(0) if m else None)
if m: print(' #wrapper offset:', m.start())
for sel in ['id="inner_column"','id="header"','class="columns','left_col','right_col','formatted_description','embed_wrapper','game_frame','class="footer','id="user_tools"','user_page_wrap','jam_page_wrap','view_jam_page','jam_banner_outer','jam_banner','jam_body','jam_header_widget','jam_submitter_widget','jam_content','id="entries"','jam_layout_header_widget','user_profile','profile_header','user_links','theme_editor','split_columns','game_devlog_post_page','view_game_footer']:
    i=s.find(sel); print('  %-26s %s'%(sel, 'offset %d'%i if i>=0 else '-'))
