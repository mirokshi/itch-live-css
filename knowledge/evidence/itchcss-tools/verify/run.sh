#!/bin/sh
# run.sh <test.html> [w] [h]  -- headless Edge, throwaway profile, all DNS blocked; prints <pre id=out>
SP="${WORK:?set WORK to a scratch dir containing raw/ and tests/}"
B="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
timeout 60 "$B" --headless=new --disable-gpu --no-first-run --no-default-browser-check \
  --user-data-dir="$(cygpath -w $SP)\edge-profile" --host-resolver-rules="MAP * ~NOTFOUND" \
  --window-size=${2:-1400},${3:-900} --virtual-time-budget=3000 \
  --dump-dom "file:///$(cygpath -m $SP)/tests/$1" 2>/dev/null \
  | python -I -c "import sys,re,html;s=sys.stdin.read();m=re.search(r'<pre id=\"out\">(.*?)</pre>',s,re.S);print(html.unescape(m.group(1)) if m else 'NO OUTPUT')"
