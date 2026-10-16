#!/bin/sh
# run.sh <test.html> [w] [h] : headless Edge on $WORK/tests/<test.html>, throwaway profile, every hostname mapped to NOTFOUND; prints <pre id=out>
: "${WORK:?set WORK}"; B="${EDGE:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
timeout 90 "$B" --headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-extensions \
  --user-data-dir="$(cygpath -w "$WORK")\edge-prof" --host-resolver-rules="MAP * ~NOTFOUND" \
  --window-size=${2:-1400},${3:-900} --virtual-time-budget=4000 \
  --dump-dom "file:///$(cygpath -m "$WORK")/tests/$1" 2>/dev/null \
  | python -I -c "import sys,re,html;sys.stdout.reconfigure(encoding='utf-8');s=sys.stdin.buffer.read().decode('utf8','replace');m=re.search(r'<pre id=\"out\">(.*?)</pre>',s,re.S);print(html.unescape(m.group(1)) if m else 'NO OUTPUT')"
