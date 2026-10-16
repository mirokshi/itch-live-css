#!/bin/sh
# usage: fetch.sh <outdir> <name> <url>  (GET, browser UA, 6 s sleep before)
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
cd "$1" || exit 1
sleep 6
curl -s --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -D "$2.headers" -w "$2 %{http_code} %{size_download}\n" "$3" -o "$2"
echo "$(date -u +%FT%TZ) $2 $3" >> ../requests.log
