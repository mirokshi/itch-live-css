#!/bin/bash
# usage: scripts/fetch.sh <url> <outname> -- GET (browser UA) into ../raw/<outname>.html + .headers, logs with status, sleeps 7 s.
# 0 x 429 in 33 requests at ~7.5 s spacing (2026-10-14 13:05-13:23 UTC). Check the printed status; on 429 wait >=60 s and retry.
D="$(cd "$(dirname "$0")/.." && pwd)"; mkdir -p "$D/raw"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
code=$(curl -sS -L --compressed -A "$UA" -H 'Accept-Language: en-US,en;q=0.9' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' -D "$D/raw/$2.headers" -o "$D/raw/$2.html" -w "%{http_code} %{size_download}" "$1")
echo "$(date -u +%FT%TZ) GET $1 -> $2 [$code]" | tee -a "$D/requests.log"
sleep 7
