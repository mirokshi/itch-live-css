#!/usr/bin/env bash
# Polite fetcher used for section 03 (page anatomy).
# usage: OUT=/some/scratch bash fetch.sh <url> <name>
#   -> $OUT/raw/<name>.html + $OUT/raw/<name>.headers ; appends to $OUT/raw/requests.log ; sleeps 5 s after.
# Keep $OUT outside the repository: raw itch HTML is third-party content and must not be committed.
# Honor https://itch.io/robots.txt and <user>.itch.io/robots.txt before fetching; GET only; back off on HTTP 429.
set -u
D="${OUT:-/tmp/section03}/raw"; mkdir -p "$D"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
code=$(curl -s --compressed -A "$UA" -H 'Accept-Language: en-US,en;q=0.9' -D "$D/$2.headers" -o "$D/$2.html" -w '%{http_code}' "$1")
echo "$(date -u +%FT%TZ) $code $1 -> $2" | tee -a "$D/requests.log"
sleep 5
