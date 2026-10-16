#!/bin/bash
# Verifier's polite fetcher (2026-10-14). usage: OUT=dir vget.sh <listfile with "name url [ua]">
# GET only, browser UA, robots guard, 5 s spacing, stops on 429 for 60 s once.
OUT=${OUT:?}
mkdir -p "$OUT/raw"; touch "$OUT/reqlog.txt"
UA_DESK='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
UA_IPH='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
while read -r name url ua; do
  [ -z "$name" ] && continue
  case "$url" in
    *itch.io/embed/*|*itch.io/search*|*/checkout/*|*/game/download/*|*/bundle/download/*|*/register-for-purchase/*|*.itch.io/*/download/*|*.itch.io/*/rh/*|*.itch.io/*/rp/*|*.itch.io/-/*|*/email-feedback/*|*/embed-upload/*)
      echo "BLOCKED $url"; continue;;
  esac
  A="$UA_DESK"; [ "$ua" = "iphone" ] && A="$UA_IPH"
  for try in 1 2; do
    code=$(curl -s --compressed -A "$A" -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
      -H 'Accept-Language: en-US,en;q=0.9' -D "$OUT/raw/$name.headers" -o "$OUT/raw/$name.html" \
      -w '%{http_code} %{size_download}' "$url")
    echo "$(date -u +%FT%TZ) GET $url ${ua:-desktop} -> $code" >> "$OUT/reqlog.txt"
    echo "$name: $code"
    case "$code" in 429*) sleep 60;; *) break;; esac
  done
  sleep 5
done < "$1"
