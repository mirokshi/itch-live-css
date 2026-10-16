#!/bin/bash
# usage: fetch.sh <url> <outname>  -- GET with a browser UA into ./raw/<outname>.html (+ .headers), logs, then sleeps 5 s.
# Check the status code it prints: itch answers 429 (plain openresty page) on bursts; back off and retry later.
D="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$D/raw"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
curl -sS -L --compressed -A "$UA" -H 'Accept-Language: en-US,en;q=0.9' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' -D "$D/raw/$2.headers" -o "$D/raw/$2.html" -w "%{http_code} %{size_download} %{url_effective}\n" "$1"
echo "$(date -u +%FT%TZ) GET $1 -> $2" >> "$D/requests.log"
sleep 5
