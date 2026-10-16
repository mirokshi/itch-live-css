#!/bin/sh
# usage: LOG=<file> r2-fetch.sh <url> <outfile>
# GET with a desktop Chrome UA, logs "time status bytes url", then sleeps 1.6 s (itch etiquette: <=1 req/s).
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36"
r=$(curl -sS -L --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -o "$2" -w "%{http_code} %{size_download}" "$1")
echo "$(date +%H:%M:%S) $r $1" | tee -a "${LOG:-requests.log}"
sleep 1.6
