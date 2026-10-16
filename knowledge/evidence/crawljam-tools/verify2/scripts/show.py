import sys,json
for l in sys.stdin:
  o=json.loads(l)
  print(o['f'],'style_ids=',o['style_ids'],'custom_css_el=',o['custom_css_el'],'wrapper=',o['wrapper'],'jt',o.get('jt_len'),'gen',o.get('gen_len'),'custom',o.get('custom_len'),'imp',o.get('important_in_gen'))
  print('   body:',(o['body'] or '')[:150]); print('   vjp:',o['vjp_class']); print('   head:',o['head_order']); print('   footer_div',o['footer_div'],'itch_footer',o['itch_footer'],'entries',o['entries'],'page',o['page_name'])
  print('   custom_head:',repr(o.get('custom_head')))
  print('   root:',o.get('root')); w=o.get('wrap_decl') or {}; print('   wrap extras:',{k:v for k,v in w.items() if k.startswith('background') or k in('font-family','font-size','--itchio_border_radius')}, 'link',w.get('--itchio_link_color'),'btn',w.get('--itchio_button_color'))
  if o.get('page_widget_decl'): print('   page_widget:',o['page_widget_decl'])
