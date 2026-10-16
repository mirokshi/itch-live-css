#!/bin/sh
# usage: OUT=./raw sh g.sh <outname> <url>
# Polite GET: browser UA, gzip, 3 s pause after each request, retry on 429 after 35 s (max 3 tries). Logs TSV to $OUT/../fetchlog.tsv
OUT=${OUT:-./raw}; mkdir -p "$OUT"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
for try in 1 2 3; do
  r=$(curl -s -L --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -o "$OUT/$1" -w "%{http_code}\t%{size_download}\t%{url_effective}" "$2")
  printf "%s\t%s\t%s\n" "$(date -u +%FT%TZ)" "$1" "$r" >> "$OUT/../fetchlog.tsv"
  code=$(printf "%s" "$r" | cut -f1)
  if [ "$code" = "429" ]; then sleep 35; else break; fi
done
printf "%s\t%s\n" "$1" "$r"
sleep 3
