#!/usr/bin/env bash
# Polite logged-out fetcher for the section-03 gap fill (round 2).
# usage: OUT=<scratch dir> bash fetch.sh <list.txt>     list lines: "<name> <url>"
# -> $OUT/raw/<name>.html + .headers ; log in $OUT/raw/requests.log ; >=7 s between requests;
#    one 70 s back-off retry on HTTP 429; refuses robots-disallowed paths. GET only, no cookies kept.
set -u
D="${OUT:?set OUT}/raw"; mkdir -p "$D"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
while read -r name url; do
  [ -z "$name" ] && continue
  case "$url" in
    */embed/*|*/embed-upload/*|*/search*|*/checkout/*|*/game/download/*|*/bundle/download/*|*/register-for-purchase/*|*/email-feedback/*|*/download/*|*/rh/*|*/rp/*|*/-/*)
      echo "SKIP robots $url"; continue;;
  esac
  for try in 1 2; do
    code=$(curl -s --compressed -A "$UA" -H 'Accept-Language: en-US,en;q=0.9' -D "$D/$name.headers" -o "$D/$name.html" -w '%{http_code}' "$url")
    echo "$(date -u +%FT%TZ) $code $url -> $name" | tee -a "$D/requests.log"
    if [ "$code" = "429" ] && [ $try = 1 ]; then sleep 70; else break; fi
  done
  sleep 7
done < "$1"
