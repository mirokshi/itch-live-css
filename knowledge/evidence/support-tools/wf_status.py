import json,sys
d=json.load(open(sys.argv[1],encoding='utf-8'))
f=d['features']
ids=sys.argv[2].split(',')
for i in ids:
    v=f.get(i)
    if not v: print(i,'MISSING'); continue
    if v.get('kind')!='feature': print(i,v); continue
    s=v.get('status',{})
    print(f"== {i} ({v['name']}) baseline={s.get('baseline')} low={s.get('baseline_low_date')} high={s.get('baseline_high_date')}")
    print("   support:", s.get('support'))
    print("   spec:", v.get('spec'))
    if len(sys.argv)>3:
        for bs in s.get('by_compat_key',{}).items() if 'by_compat_key' in s else []:
            print('   ',bs)
        print('   compat_features:', v.get('compat_features'))
