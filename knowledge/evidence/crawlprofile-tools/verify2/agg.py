import json,sys
from collections import Counter
fn=sys.argv[1]
d=[x for x in json.load(open(fn,encoding='utf-8')) if x.get('wrapper')]
print(fn,len(d),'creator pages')
def C(f): 
    c=Counter()
    for x in d:
        v=f(x)
        if isinstance(v,dict): c.update(v)
        elif isinstance(v,list): c.update(v)
        else: c[str(v)]+=1
    return c
print('wrapper',C(lambda x:x['wrapper']))
print('wrapper_parent',C(lambda x:x['wrapper_parent']))
print('wrapper_children',C(lambda x:' | '.join(x['wrapper_children'])))
print('user_page base',C(lambda x:' '.join(x['user_page_classes'][:4])))
mods=Counter()
for x in d: mods.update(x['user_page_classes'][4:])
print('modifiers',mods)
print('header',C(lambda x:x['header']))
print('banner_parent',C(lambda x:x['banner_parent']), 'h1_parent',C(lambda x:x['h1_parent']))
print('banner attrs',C(lambda x:','.join(x['banner_attrs'])))
print('h1 nonempty',C(lambda x:x['h1_text_nonempty']))
print('has_columns',C(lambda x:x['has_columns']))
print('no-columns pc children',[ (x['file'],x['profile_content_children']) for x in d if not x['has_columns']])
print('pc children (cols)',C(lambda x:' | '.join(x['profile_content_children']) if x['has_columns'] else 'nocols'))
print('user_links_sig',C(lambda x:x.get('user_links_sig')))
print('user_links_empty',C(lambda x:x.get('user_links_empty')))
print('link_group_shapes',C(lambda x:x.get('link_group_shapes',{})))
print('link_a',C(lambda x:x.get('link_a',{})))
print('bio',C(lambda x:x['bio']))
print('footer_parent',C(lambda x:x['footer_parent']))
print('footer_shape',C(lambda x:x['footer_shape']))
print('footer nlinks',C(lambda x:len(x['footer_links'])))
print('footer texts',C(lambda x:[t for h,t in x['footer_links']]))
print('ids',C(lambda x:x['ids_in_wrapper']))
print('inner_column parents',C(lambda x:x['inner_column_parents']))
print('html_lang',C(lambda x:x['html_lang']),'page_name',C(lambda x:x['page_name']))
print('body_class',C(lambda x:x['body_class']))
print('body_attrs_order',C(lambda x:','.join(x['body_attrs_order'])))
print('body_children',C(lambda x:' | '.join(x['body_children'])))
print('user_tools',C(lambda x:x['user_tools']))
print('user_tools_before_wrapper',C(lambda x:x['user_tools_before_wrapper']))
