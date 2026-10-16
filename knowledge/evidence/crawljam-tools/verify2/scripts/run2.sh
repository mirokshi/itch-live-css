#!/bin/bash
# usage: scripts/run2.sh <html in ../tests/> [width] -> offline headless Chrome (every host unresolvable, throwaway profile), prints V2RESULT json
# headless Chrome clamps the window to >=500px wide; innerWidth = width - 16 (scrollbar)
D="$(cd "$(dirname "$0")/.." && pwd)"; W=${2:-1280}
timeout 60 "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-first-run --no-default-browser-check --user-data-dir="$(cygpath -w "$D/tests/prof")" --host-resolver-rules="MAP * ~NOTFOUND" --window-size=$W,900 --virtual-time-budget=3000 --dump-dom "file:///$(cygpath -m "$D/tests/$1")" 2>/dev/null | grep -o 'V2RESULT {.*}' | sed 's/&quot;/"/g'
