"""Verifier pass 2: independent corpus statistics over the first run's raw pages.
usage: python -I stats.py map62.tsv rawdir
Extraction is attribute-order independent:
  profile/project: <style ... id="custom_css" ...>
  jam: <style ... id="jam_theme" ...> tail after the last `.jam_filter_picker .divider{...}`
"""
import re, sys, os, statistics, json
from collections import Counter, defaultdict
sys.stdout.reconfigure(encoding='utf-8')

def extract(d):
    m = re.search(rb'<style\b[^>]*\bid="custom_css"[^>]*>(.*?)</style>', d, re.S)
    if m: return m.group(1)
    m = re.search(rb'<style\b[^>]*\bid="jam_theme"[^>]*>(.*?)</style>', d, re.S)
    if m:
        t = m.group(1); k = t.rfind(b'.jam_filter_picker .divider{')
        return t[t.index(b'}', k) + 1:]
    return None

def strip(s):
    """return (code with comments and strings blanked, comments list, strings list)"""
    out = []; comments = []; strings = []; i = 0; n = len(s)
    while i < n:
        c = s[i]
        if c == '/' and s.startswith('/*', i):
            j = s.find('*/', i + 2); j = n if j < 0 else j + 2
            comments.append(s[i:j]); out.append(' '); i = j; continue
        if c in '"\'':
            j = i + 1
            while j < n and s[j] != c:
                if s[j] == '\\': j += 1
                elif s[j] == '\n': break
                j += 1
            strings.append(s[i:j + 1]); out.append('""'); i = j + 1; continue
        out.append(c); i += 1
    return ''.join(out), comments, strings

def blocks(code):
    """yield (prelude, body, depth_context) for top-level-ish style rules (descending into @media/@supports/@layer/@container/@document/@scope)."""
    res = []
    def walk(s, ctx):
        i = 0; n = len(s); start = 0
        while i < n:
            c = s[i]
            if c == '{':
                pre = s[start:i].strip()
                depth = 1; j = i + 1
                while j < n and depth:
                    if s[j] == '{': depth += 1
                    elif s[j] == '}': depth -= 1
                    j += 1
                body = s[i + 1:j - 1]
                if pre.startswith('@'):
                    name = re.match(r'@([\w-]+)', pre)
                    name = name.group(1).lower() if name else ''
                    if name in ('media', 'supports', 'layer', 'container', 'document', '-moz-document', 'scope', 'starting-style'):
                        walk(body, ctx + [name])
                    else:
                        res.append(('@' + name, pre, body, ctx))
                else:
                    res.append(('rule', pre, body, ctx))
                i = j; start = j; continue
            if c == ';':
                start = i + 1
            if c == '}':
                start = i + 1
            i += 1
    walk(code, [])
    return res

def nested_rules(body):
    # count '{' inside a style rule body = nested rules
    return body.count('{')

def main():
    mp = [l.split('\t') for l in open(sys.argv[1], encoding='utf-8').read().splitlines()]
    raw = sys.argv[2]
    P = []
    for kind, url, fn, ok in mp:
        b = extract(open(os.path.join(raw, fn), 'rb').read())
        s = b.decode('utf-8')
        code, comments, strings = strip(s)
        bl = blocks(code)
        sels = []
        for typ, pre, body, ctx in bl:
            if typ == 'rule':
                for x in pre.split(','):
                    x = x.strip()
                    if x: sels.append(x)
        imports = re.findall(r'@import\s+(?:url\()?\s*["\']?([^"\')\s;]+)', s)
        # @import placement: is there any non-@import/@charset construct before it (in code)?
        first_imp = code.find('@import')
        before = code[:first_imp].strip() if first_imp >= 0 else None
        ff = re.findall(r'@font-face\s*\{([^}]*)\}', s)
        ffsrc = []
        for f in ff:
            ffsrc += re.findall(r'url\(\s*["\']?([^"\')]+)', f)
        urls = re.findall(r'url\(\s*["\']?([^"\')\s]+)', s)
        urls_code = []  # url() outside comments
        sc = re.sub(r'/\*.*?\*/', ' ', s, flags=re.S)
        urls_code = re.findall(r'url\(\s*["\']?([^"\')\s]+)', sc)
        imports_code = re.findall(r'@import\s+(?:url\()?\s*["\']?([^"\')\s;]+)', sc)
        P.append(dict(
            kind=kind, url=url, b=len(b), c=len(s), crlf=b.count(b'\r\n'), lf=b.count(b'\n') - b.count(b'\r\n'),
            lead_ws=s[:1].isspace() if s else False, trail_ws=s[-1:].isspace() if s else False,
            trail_space_only=(s.endswith(' ') and not s.endswith('  ')),
            entities=len(re.findall(r'&(?:gt|lt|amp|quot|apos|#\d+|#x[0-9a-fA-F]+);', s)),
            gt_code=code.count('>'), lt_raw=s.count('<'), amp_raw=s.count('&'),
            comments=len(comments), comment_bytes=sum(len(x.encode()) for x in comments),
            ws=sum(1 for ch in s if ch.isspace()) / max(1, len(s)),
            single_line=('\n' not in s.strip()),
            important_all=s.count('!important'), important_code=len(re.findall(r'!\s*important', code)),
            nonascii=sorted(set(ch for ch in s if ord(ch) > 127)), fffd=s.count('�'), bom=s.count('﻿'), nbsp=s.count('\xa0'),
            astral=[hex(ord(ch)) for ch in s if ord(ch) > 0xffff],
            escapes=len(re.findall(r'\\[0-9a-fA-F]{1,6}', s)), escapes_code=None,
            imports=imports, imports_code=imports_code, import_before=before,
            fontface=len(ff), ffsrc=ffsrc, urls=urls, urls_code=urls_code,
            data_uris=re.findall(r'url\(\s*["\']?data:([^;,]+)[^)]*', s),
            data_lens=[len(m.group(0)) for m in re.finditer(r'data:[^"\')]+', s)],
            sels=sels, unscoped=[x for x in sels if '#wrapper' not in x],
            rootish=[x for x in sels if re.match(r'^(:root|html|body)\b', x) or re.search(r'(^|[\s>+~])(html|body)\b', x)],
            header=[x for x in sels if re.search(r'\.header_widget|\.primary_header', x)],
            usertools=[x for x in sels if re.search(r'[#.]user_tools', x)],
            nested=sum(nested_rules(body) for t, pre, body, ctx in bl if t == 'rule'),
            nest_gt=len(re.findall(r'&\s*>', code)),
            code=code, s=s, blocks=bl,
        ))
    return P

if __name__ == '__main__':
    P = main()
    import pickle
    pickle.dump(P, open(sys.argv[3], 'wb'))
    print('pages', len(P))
