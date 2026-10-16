#!/bin/sh
# usage: WORK=<workdir> run.sh <test.html> [width] [height]
# <workdir> must contain raw/ (downloaded itch CSS) and tests/ (harness pages built by mkharness.py).
# Runs headless Edge/Chrome with a THROWAWAY profile and ALL network blocked, prints <pre id="out"> JSON.
BROWSER="${BROWSER:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
P=$(cygpath -w "$WORK")
timeout 60 "$BROWSER" --headless=new --disable-gpu --no-first-run --no-default-browser-check \
  --user-data-dir="$P\edge-profile" --host-resolver-rules="MAP * ~NOTFOUND" \
  --window-size=${2:-1400},${3:-900} --virtual-time-budget=3000 \
  --dump-dom "file:///$(cygpath -m "$WORK")/tests/$1" 2>/dev/null \
  | python -I -c "import sys,re,html;s=sys.stdin.read();m=re.search(r'<pre id=\"out\">(.*?)</pre>',s,re.S);print(html.unescape(m.group(1)) if m else 'NO OUTPUT')"
