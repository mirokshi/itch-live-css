import sys, re
sys.stdout.reconfigure(encoding="utf-8")
# usage: themecss.py page.html styleid -- list selectors of a <style id=..> block, flag ID selectors, list --itchio_* declarations per selector
s=open(sys.argv[1],encoding='utf-8',errors='replace').read()
m=re.search(r'<style[^>]*id="%s"[^>]*>(.*?)</style>'%re.escape(sys.argv[2]),s,re.S)
css=re.sub(r'/\*.*?\*/','',m.group(1),flags=re.S)
rules=re.findall(r'([^{}]+)\{([^{}]*)\}',css)
ids=0
print('rules:',len(rules))
for sel,body in rules:
    sel=' '.join(sel.split())
    hasid=bool(re.search(r'#[A-Za-z_]',sel)); ids+=hasid
    vars_=re.findall(r'(--itchio_[a-z0-9_]+)\s*:',body)
    print(('[ID] ' if hasid else '     ')+sel[:110]+('   VARS: '+','.join(vars_) if vars_ else ''))
print('rules with an ID selector:',ids)
