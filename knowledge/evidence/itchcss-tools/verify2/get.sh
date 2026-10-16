#!/bin/sh
# get.sh <name> <url> : one GET into $WORK/raw/<name> (+ .headers); sleeps 6 s first; logs to $WORK/requests.log
: "${WORK:?set WORK to a scratch dir (never the repo)}"; mkdir -p "$WORK/raw"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0"
sleep 6
curl -s --compressed -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -D "$WORK/raw/$1.headers" -o "$WORK/raw/$1" -w "$1 %{http_code} %{size_download}\n" "$2"
echo "$(date -u +%FT%TZ) $1 $2" >> "$WORK/requests.log"
