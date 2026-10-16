import json,sys
from collections import Counter
fn=sys.argv[1]
d=[x for x in json.load(open(fn,encoding='utf-8')) if x.get('wrapper')]
if len(sys.argv)>2: d=[x for x in d if x['file'] not in ('mobile_mirokshi.html','es_mirokshi.html')]
print(fn,len(d))
def C(f):
    c=Counter()
    for x in d:
        v=f(x)
        if isinstance(v,dict):
            for k,n in v.items(): c[k]+=n
        elif isinstance(v,list): c.update(v)
        else: c[str(v)]+=1
    return c
for k in ['cell_class_sets','cell_attrs','thumb_img_attrs','thumb_img_cls','thumb_a','cell_data_children','game_title_children','price_tags','price_tag_parent','platform_kids','is_owner_where','grids']:
    print('--',k); 
    for a,b in C(lambda x:x[k]).most_common(14): print('  ',b,a)
print('cells',sum(x['n_cells'] for x in d),'thumbs',sum(x['thumbs'] for x in d),'thumb_inline_bg',sum(x['thumb_inline_bg'] for x in d))
print('own grid cells',sum(x['own_grid_cells'] for x in d),'author in own grid',sum(x['author_in_own_grid'] for x in d))
print('lazy imgs with src',sum(x['lazy_imgs_with_src'] for x in d))
print('sections',C(lambda x:x['sections']))
print('pages with collections',sum(1 for x in d if any('collections' in s for s in x['sections'])),'purchased',sum(1 for x in d if any('purchased' in s for s in x['sections'])))
print('collection_rows',C(lambda x:x['collection_rows']).most_common(6))
print('purchased_h2',[x['purchased_h2'][:20] for x in d if x['purchased_h2']])
print('bio_classes',C(lambda x:x.get('bio_classes',{})))
print('bio pages with custom-',sum(1 for x in d if any(k.startswith('custom-') for k in x.get('bio_classes',{}))),'text-center',sum(1 for x in d if 'text-center' in x.get('bio_classes',{})))
print('bio_tags',sorted(C(lambda x:x.get('bio_tags',{})).keys()))
print('bio_ext',C(lambda x:x.get('bio_ext_links',{})))
print('bio_int',C(lambda x:x.get('bio_int_links',{})))
print('bio_imgs',C(lambda x:x.get('bio_imgs',{})))
print('bio inline style pages',sum(1 for x in d if x.get('bio_inline_style',0)>0))
