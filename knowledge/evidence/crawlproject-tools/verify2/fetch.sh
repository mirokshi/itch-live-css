#!/bin/bash
# usage: fetch.sh listfile   (lines: name url [iphone])
# GET only, robots guard, 6 s spacing, one 70 s retry on 429.
OUT="${OUT:?}"; mkdir -p "$OUT/raw"
UA_D='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
UA_M='Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
while read -r name url mode; do
  [ -z "$name" ] && continue
  case "$url" in
    *itch.io/embed/*|*itch.io/embed-upload/*|*itch.io/search*|*/checkout/*|*/game/download/*|*/bundle/download/*|*/register-for-purchase/*|*/email-feedback/*|*.itch.io/*/download/*|*.itch.io/*/rh/*|*.itch.io/*/rp/*|*.itch.io/-/*) echo "ROBOTS-SKIP $url"; continue;;
  esac
  ua="$UA_D"; [ "$mode" = iphone ] && ua="$UA_M"
  for try in 1 2; do
    code=$(curl -sS -A "$ua" -H 'Accept-Language: en-US,en;q=0.9' -H 'Accept: text/html,application/xhtml+xml,*/*;q=0.8' --compressed -D "$OUT/raw/$name.headers" -o "$OUT/raw/$name.html" -w '%{http_code}' "$url")
    sz=$(stat -c %s "$OUT/raw/$name.html" 2>/dev/null)
    echo "$(date -u +%FT%TZ) GET $url ${mode:-desktop} -> $code $sz" | tee -a "$OUT/reqlog.txt"
    if [ "$code" = 429 ] && [ $try = 1 ]; then sleep 70; else break; fi
  done
  sleep 6
done < "$1"
