#!/bin/bash
# usage: f.sh <url> <name> [extra curl args...]   polite logged-out GET, 4 s spacing
OUT="${OUT:?set OUT to a scratch directory}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
url="$1"; name="$2"; shift 2
sleep 4
code=$(curl -s --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" "$@" -D "$OUT/$name.headers" -o "$OUT/$name.html" -w "%{http_code}\t%{size_download}" "$url")
echo -e "$(date -u +%FT%TZ)\t$url\t$name\t$code" | tee -a "$OUT/fetchlog.tsv"
