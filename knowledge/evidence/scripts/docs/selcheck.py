import re, sys
sys.stdout.reconfigure(encoding='utf-8')
# usage: selcheck.py file.html...  -- reports documented ids/classes presence + style tag ids
DOC = {'#wrapper': r'id="wrapper"', '#inner_column': r'id="inner_column"', '.inner_column': r'class="[^"]*\binner_column\b',
 '.header': r'class="[^"]*\bheader\b[^"]*"', '.columns': r'class="[^"]*\bcolumns\b', '.left_col.column': r'class="[^"]*\bleft_col\b[^"]*\bcolumn\b|class="[^"]*\bcolumn\b[^"]*\bleft_col\b',
 '.right_col.column': r'class="[^"]*\bright_col\b', '.formatted_description': r'class="[^"]*\bformatted_description\b', '.footer': r'class="[^"]*\bfooter\b',
 '.embed_wrapper': r'class="[^"]*\bembed_wrapper\b', '.game_frame': r'class="[^"]*\bgame_frame\b',
 '.jam_page_wrap': r'class="[^"]*\bjam_page_wrap\b', '.view_jam_page': r'class="[^"]*\bview_jam_page\b', '.jam_banner_outer': r'class="[^"]*\bjam_banner_outer\b', '.jam_banner': r'class="[^"]*\bjam_banner\b',
 '.jam_body': r'class="[^"]*\bjam_body\b', '#entries': r'id="entries"', '.jam_header_widget': r'class="[^"]*\bjam_header_widget\b', '.jam_submitter_widget': r'class="[^"]*\bjam_submitter_widget\b', '.jam_content.user_formatted': r'class="[^"]*\bjam_content\b[^"]*\buser_formatted\b',
 '.user_page_wrap': r'class="[^"]*\buser_page_wrap\b', '.user_page': r'class="[^"]*\buser_page\b', '#profile_header': r'id="profile_header"', '.user_profile': r'class="[^"]*\buser_profile\b', '.user_links': r'class="[^"]*\buser_links\b'}
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8', errors='replace').read()
    print('==', f)
    print('  present:', [k for k, v in DOC.items() if re.search(v, s)])
    w = re.search(r'<div[^>]*id="wrapper"[^>]*>', s); print('  wrapper tag:', w.group(0)[:200] if w else None)
    print('  style ids:', re.findall(r'<style[^>]*id="([^"]+)"', s))
    print('  body class:', (re.search(r'<body[^>]*>', s).group(0)[:250]))
    for v in sorted(set(re.findall(r'--itchio_[a-z_0-9]+', s))): print('   var', v)
