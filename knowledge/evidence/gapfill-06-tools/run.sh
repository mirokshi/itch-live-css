#!/bin/sh
# usage: run.sh <www_dir> <out_dir> <port> page1.html ...
# Serves <www_dir> on 127.0.0.1:<port>, loads each page in headless Chrome with every
# other host unresolvable (no requests to itch or any CDN), prints the RESULT line.
WWW=$1; OUT=$2; PORT=$3; shift 3
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p "$OUT"
python -I -m http.server "$PORT" --bind 127.0.0.1 --directory "$WWW" >"$OUT/server.log" 2>&1 &
SRV=$!
sleep 1
for p in "$@"; do
  "$CH" --headless=new --disable-gpu --no-first-run --user-data-dir="$OUT/prof" \
    --host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1" \
    --virtual-time-budget=5000 --dump-dom "http://127.0.0.1:$PORT/$p" > "$OUT/$p" 2>/dev/null
  printf '%s\t' "$p"; grep -o 'RESULT {.*}' "$OUT/$p" | sed 's/&quot;/"/g' || echo NO-RESULT
done
kill $SRV
