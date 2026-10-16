#!/bin/bash
# Polite fetcher used for the crawlproject evidence (2026-10-14).
# usage: OUT=/path/to/scratch ./get.sh <name> <url>
#   -> $OUT/raw/<name>.html + $OUT/raw/<name>.headers ; appends to $OUT/reqlog.txt ; sleeps 4 s
# Refuses URLs disallowed by itch.io/robots.txt and <user>.itch.io/robots.txt.
# 4 s spacing produced zero HTTP 429s; 1.3 s and 3 s spacing both got 429 (openresty) bursts.
OUT=${OUT:?set OUT to a scratch directory}
mkdir -p "$OUT/raw"; touch "$OUT/reqlog.txt"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
name="$1"; url="$2"
case "$url" in
  *itch.io/embed/*|*itch.io/search*|*/checkout/*|*/game/download/*|*/bundle/download/*|*/register-for-purchase/*|*.itch.io/*/download/*|*.itch.io/*/rh/*|*.itch.io/*/rp/*|*.itch.io/-/*|*/email-feedback/*|*/embed-upload/*)
    echo "BLOCKED by robots: $url"; exit 1;;
esac
code=$(curl -s --compressed -A "$UA" -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.9' -D "$OUT/raw/$name.headers" -o "$OUT/raw/$name.html" \
  -w '%{http_code} %{size_download} %{url_effective}' "$url")
echo "$(date -u +%FT%TZ) GET $url -> $code" >> "$OUT/reqlog.txt"
echo "$name: $code"
sleep 4
