#!/bin/bash
# usage: run.sh <html file in tests/> [width]  -> runs headless Chrome offline (all hosts blocked) and prints RESULT json
D="$(cd "$(dirname "$0")" && pwd)"
W=${2:-1280}
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-first-run --user-data-dir="$(cygpath -w "$D/tests/chrome-profile")" --host-resolver-rules="MAP * ~NOTFOUND" --window-size=$W,900 --virtual-time-budget=3000 --dump-dom "file:///$(cygpath -m "$D/tests/$1")" 2>/dev/null | grep -o 'RESULT {.*}' | sed 's/&quot;/"/g'
