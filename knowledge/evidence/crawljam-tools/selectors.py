# usage: python -I selectors.py files... -> lists selectors of the custom part of style#jam_theme (after the generated theme)
import sys,re,collections
sys.stdout.reconfigure(encoding='utf-8')
def custom(h):
    m=re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>',h,re.S)
    if not m: return None
    t=m.group(1); k=t.find('.jam_filter_picker .divider{')
    return t[t.find('}',k)+1:] if k>=0 else None
def selectors(css):
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    out=[]; depth=0; buf=''; stack=[]
    i=0
    while i<len(css):
        ch=css[i]
        if ch=='{':
            sel=buf.strip(); buf=''
            stack.append(sel)
            if not sel.startswith('@') and not any(s.startswith('@keyframes') or s.startswith('@-webkit-keyframes') for s in stack[:-1]):
                out.append((tuple(s for s in stack[:-1] if s.startswith('@')),sel))
        elif ch=='}':
            if stack: stack.pop()
            buf=''
        elif ch==';' and not stack:
            buf=''
        else: buf+=ch
        i+=1
    return out
cats=collections.Counter()
for f in sys.argv[1:]:
    c=custom(open(f,encoding='utf8').read())
    if not c or not c.strip(): continue
    print('=====',f)
    for at,sel in selectors(c):
        for s in sel.split(','):
            s=' '.join(s.split())
            first=s.split()[0] if s else ''
            if first.startswith('#wrapper'): k='#wrapper-scoped'
            elif re.match(r'(?i)(html|body|:root)\b',first): k='html/body/:root'
            elif re.search(r'(^|[^_a-z])(header_widget|primary_header|user_panel_widget|header_buttons|header_dropdown)', s): k='SITE HEADER (outside #wrapper)'
            elif first.startswith('.view_jam_page') or first.startswith('.jam_page_wrap'): k='.view_jam_page/.jam_page_wrap'
            elif first.startswith('.custom-'): k='.custom-*'
            elif first.startswith('.') : k='other itch class'
            elif first.startswith('#'): k='other id'
            else: k='element/universal'
            cats[k]+=1
            print(f'  [{k}] {"@"+" ".join(at)+" " if at else ""}{s[:110]}')
print(cats)
