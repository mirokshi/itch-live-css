#!/bin/sh
# usage: fetch_retry.sh <outname> <url> ...pairs  -- polite GET with 429 backoff (30s, max 3 tries), 4s spacing
D=$(dirname "$0")
while [ $# -ge 2 ]; do
  n=0
  while :; do
    out=$(sh "$D/fetch.sh" "$1" "$2"); echo "$out"
    case "$out" in *"	429	"*) n=$((n+1)); [ $n -ge 3 ] && break; sleep 30;; *) break;; esac
  done
  sleep 1
  shift 2
done
echo DONE
