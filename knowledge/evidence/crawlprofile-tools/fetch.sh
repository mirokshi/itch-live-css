#!/bin/bash
# Polite logged-out fetch of one itch.io URL (GET only).
# usage: OUT=/path/to/rawdir fetch.sh <url> <name>
#   writes $OUT/<name>.html (decompressed body) + $OUT/<name>.headers, appends a line to $OUT/fetchlog.tsv
# Etiquette: honor robots.txt, >=3 s between requests (itch answers 429 from openresty at ~1 req/1.2 s
# when other crawlers share the IP), never log in, never submit forms.
OUT="${OUT:?set OUT to a scratch directory}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
url="$1"; name="$2"
sleep 3
code=$(curl -s -L --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
  -D "$OUT/$name.headers" -o "$OUT/$name.html" -w "%{http_code}\t%{size_download}\t%{url_effective}" "$url")
echo -e "$(date -u +%FT%TZ)\t$url\t$name\t$code" | tee -a "$OUT/fetchlog.tsv"
