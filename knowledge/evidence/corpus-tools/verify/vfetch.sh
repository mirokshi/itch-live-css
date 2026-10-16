#!/bin/bash
# usage: vfetch.sh <url> <outname>   (raw html + headers, 5 s sleep, log)
V="${OUTDIR:?set OUTDIR}"; mkdir -p "$V/raw"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
url="$1"; out="$V/raw/$2"
code=$(curl -s -L --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -o "$out" -D "$out.headers" -w "%{http_code}" "$url")
echo "$(date -u +%FT%TZ)	$code	$(stat -c %s "$out" 2>/dev/null)	$url	$2" >> "$V/requests.log"
echo "$code $(stat -c %s "$out" 2>/dev/null) $2"
sleep 5
