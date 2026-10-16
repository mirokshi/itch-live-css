"""Numbers about style#custom_css on project pages (never prints CSS). usage: python -I vcssstats.py vcss.py file..."""
import sys, re, collections, importlib.util, html as H
spec = importlib.util.spec_from_file_location('v', sys.argv[1]); v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
cls = collections.Counter(); rows_out = []
for f in sys.argv[2:]:
    h = open(f, encoding='utf-8', errors='replace').read()
    if 'data-page_name="view_game"' not in h: continue
    m = re.search(r'<style[^>]*id="custom_css"[^>]*>(.*?)</style>', h, re.S)
    if not m: continue
    raw = m.group(1)
    nocom = v.strip_comments(raw)
    rules = v.parse(nocom)
    sels = []
    for med, s, b in rules:
        if s.startswith('@'): continue
        for part in s.split(','):
            part = part.strip()
            if part and not re.match(r'^(from|to|\d+%)$', part): sels.append(part)
    scoped = sum(1 for s in sels if s.startswith('#wrapper'))
    datauri = sum(len(x) for x in re.findall(r'data:[^)\'"]*', raw))
    imports = [i for i in re.finditer(r'@import', nocom)]
    first_stmt_import = nocom.lstrip().startswith('@import')
    hosts = sorted(set(re.sub(r'^(https?:)?//([^/]+).*', r'\2', u.strip('\'" ')) if not u.strip('\'" ').startswith('data:') else 'data:' for u in re.findall(r'url\(([^)]*)\)', nocom)))
    imp_hosts = sorted(set(re.findall(r'@import\s+(?:url\()?["\']?https?://([^/"\')]+)', nocom)))
    feats = {
        'file': f.split('/')[-1], 'len': len(raw), 'comments': len(re.findall(r'/\*', raw)), 'lines': raw.count('\n') + 1,
        'gt_raw': '>' in nocom, 'gt_escaped': '&gt;' in raw, 'nsel': len(sels), 'scoped': scoped,
        'body_sel': any(re.match(r'^(html|body)\b', s) for s in sels), 'has': ':has(' in nocom, 'user_tools': 'user_tools' in nocom,
        'media': '@media' in nocom, 'keyframes': '@keyframes' in nocom, 'import': len(imports), 'import_first': first_stmt_import,
        'imp_hosts': imp_hosts, 'url_hosts': hosts, 'datauri_chars': datauri, 'important': nocom.count('!important'),
    }
    rows_out.append(feats)
    found = set(re.findall(r'\.([a-zA-Z_][\w-]*)', ' '.join(sels))) | set('#' + x for x in re.findall(r'#([a-zA-Z_][\w-]*)', ' '.join(sels)))
    for c in found: cls[c] += 1
print('pages with custom_css:', len(rows_out))
for r in sorted(rows_out, key=lambda r: r['len']):
    print({k: r[k] for k in r})
print('over 5120:', [(r['file'], r['len'], r['datauri_chars']) for r in rows_out if r['len'] > 5120])
print('with comments:', sum(1 for r in rows_out if r['comments']))
print('max lines:', max(r['lines'] for r in rows_out))
print('fully scoped:', sum(1 for r in rows_out if r['nsel'] and r['scoped'] == r['nsel']))
print('scoped ratio list:', sorted(round(r['scoped'] / r['nsel'], 2) if r['nsel'] else None for r in rows_out))
print('import pages:', [(r['file'], r['import'], r['import_first'], r['imp_hosts']) for r in rows_out if r['import']])
print('media', sum(r['media'] for r in rows_out), 'keyframes', sum(r['keyframes'] for r in rows_out))
print('body sel', [r['file'] for r in rows_out if r['body_sel']], 'has', [r['file'] for r in rows_out if r['has']], 'user_tools', [r['file'] for r in rows_out if r['user_tools']])
print('hosts', collections.Counter(h for r in rows_out for h in r['url_hosts']).most_common())
print('classes:', cls.most_common(45))
