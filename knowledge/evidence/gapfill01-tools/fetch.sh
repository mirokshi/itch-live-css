#!/bin/bash
# Polite GET: one request, desktop Chrome UA, logged out, GET only, then sleep 3 s.
# usage: OUTDIR=<dir> fetch.sh <url> <outname>
# Logs "utc  host  status  bytes  url  outname" to $OUTDIR/requests.log
set -u
OUTDIR="${OUTDIR:?set OUTDIR}"; mkdir -p "$OUTDIR/raw"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
url="$1"; out="$OUTDIR/raw/$2"
code=$(curl -s -L --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -o "$out" -D "$out.hdr" -w "%{http_code}" "$url")
case "$url" in *itch.io*|*itch.zone*) host=itch;; *) host=other;; esac
echo "$(date -u +%FT%TZ)	$host	$code	$(stat -c %s "$out" 2>/dev/null)	$url	$2" >> "$OUTDIR/requests.log"
echo "$code $(stat -c %s "$out" 2>/dev/null) $2"
sleep 3
