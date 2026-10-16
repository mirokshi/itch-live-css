#!/bin/sh
# usage: OUT=./raw fetch.sh <outname> <url>
# Polite GET (normal browser UA, 3 s pause after each request); appends a row to $OUT/../fetchlog.tsv.
# GET only, never logged in. Honor https://itch.io/robots.txt before adding URLs.
D=${OUT:-./raw}
mkdir -p "$D"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
r=$(curl -s -A "$UA" -o "$D/$1" -w "%{http_code}\t%{size_download}\t%{url_effective}" "$2")
printf "%s\t%s\t%s\n" "$(date -u +%FT%TZ)" "$1" "$r" >> "$D/../fetchlog.tsv"
printf "%s\t%s\n" "$1" "$r"
sleep 3
