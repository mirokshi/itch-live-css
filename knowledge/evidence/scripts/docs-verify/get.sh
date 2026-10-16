#!/bin/sh
# usage: OUT=<dir> get.sh <outname> <url>
# Polite GET: normal browser UA, 2.5 s pause after each request, on HTTP 429 waits 30 s and retries (max 3 tries).
# Writes <dir>/raw/<outname> and appends one TSV row per request to <dir>/fetchlog.tsv.
D=${OUT:-.}
mkdir -p "$D/raw"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
for try in 1 2 3; do
  r=$(curl -s -L -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -o "$D/raw/$1" -w "%{http_code}\t%{size_download}\t%{url_effective}" "$2")
  printf "%s\t%s\t%s\n" "$(date -u +%FT%TZ)" "$1" "$r" >> "$D/fetchlog.tsv"
  code=$(printf "%s" "$r" | cut -f1)
  if [ "$code" = "429" ]; then sleep 30; else break; fi
done
printf "%s\t%s\n" "$1" "$r"
sleep 2.5
