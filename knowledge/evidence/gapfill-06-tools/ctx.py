"""print the parent prelude + nested prelude of the first nested style rules (inspection only)"""
import sys, re
sys.path.insert(0, '.')
from scan import custom_css, clean
for f in sys.argv[1:]:
    keep, c = clean(custom_css(open(f, 'rb').read()).decode('utf-8', 'replace'))
    stack, pre, shown = [], [], 0
    for i, ch in enumerate(c):
        if ch == '{':
            p = ''.join(pre).strip(); pre = []
            if p.startswith('@'):
                stack.append(('at', p[:40]))
            elif stack and stack[-1][0] == 'at' and 'keyframes' in stack[-1][1]:
                stack.append(('kf', p))
            else:
                if any(s[0] == 'style' for s in stack) and shown < 3:
                    par = [s[1] for s in stack if s[0] == 'style'][-1]
                    print(f.split('/')[-1], '| parent:', par[-50:].replace('\n', ' '), '| nested:', p[:60].replace('\n', ' '))
                    shown += 1
                stack.append(('style', p))
        elif ch == '}':
            if stack: stack.pop()
            pre = []
        elif ch == ';':
            pre = []
        else:
            pre.append(ch)
    print(f.split('/')[-1], 'unclosed blocks at end:', len(stack))
    for m in re.finditer(r'@(container|charset|supports)[^{;]*', c):
        print('   ', m.group(0)[:80])
