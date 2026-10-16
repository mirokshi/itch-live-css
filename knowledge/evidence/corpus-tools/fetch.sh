#!/bin/bash
# Polite GET of one itch.io page, keeping raw HTML + response headers.
# usage: OUTDIR=/path/to/scratch ./fetch.sh <url> <outname.html>
# - one request, browser User-Agent, then sleeps 4 s (itch answered 429 to bursts
#   even at ~1 req / 3 s during the 2026-10-14 run)
# - appends "time  host  status  bytes  url  outname" to $OUTDIR/requests.log
# - NEVER pass a name containing "\r" (CRLF lists from Windows): curl then exits 23
#   before sending anything. Strip CRs from URL lists first: sed -i 's/\r$//' list.txt
set -u
OUTDIR="${OUTDIR:?set OUTDIR}"
mkdir -p "$OUTDIR/raw"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
url="$1"; out="$OUTDIR/raw/$2"
code=$(curl -s -L --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" \
  -o "$out" -D "$out.headers" -w "%{http_code}" "$url")
case "$url" in *itch.io*|*itch.zone*) host=itch;; *) host=other;; esac
echo "$(date -u +%FT%TZ)	$host	$code	$(stat -c %s "$out" 2>/dev/null)	$url	$2" >> "$OUTDIR/requests.log"
echo "$code $(stat -c %s "$out" 2>/dev/null) $2"
sleep 4
