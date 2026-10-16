#!/bin/bash
# usage: run.sh <harness html in tests/> [width] -> headless Chrome, offline (all hosts unresolvable), prints VRESULT {...}
# Uses its own throwaway profile dir; never touches a logged-in browser profile.
D="$(cd "$(dirname "$0")" && pwd)"; W=${2:-1280}
timeout 60 "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-first-run --no-default-browser-check --user-data-dir="$(cygpath -w "$D/tests/chrome-prof")" --host-resolver-rules="MAP * ~NOTFOUND" --window-size=$W,900 --virtual-time-budget=3000 --dump-dom "file:///$(cygpath -m "$D/tests/$1")" 2>/dev/null | grep -o 'VRESULT {.*}' | sed 's/&quot;/"/g'
