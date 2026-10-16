#!/bin/sh
# usage: OUTDIR=/scratch f.sh URL NAME  -> $OUTDIR/raw/NAME (+ NAME.headers), appends to $OUTDIR/requests.log
# GET only, logged out, browser UA, 10 s pause after every request (6 s still drew a 429).
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
mkdir -p "$OUTDIR/raw"
code=$(curl -s -A "$UA" -H 'Accept-Language: en-US,en;q=0.9' -D "$OUTDIR/raw/$2.headers" -o "$OUTDIR/raw/$2" -w '%{http_code}\t%{size_download}' "$1")
printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$code" "$1" "$2" | tee -a "$OUTDIR/requests.log"
sleep 10
