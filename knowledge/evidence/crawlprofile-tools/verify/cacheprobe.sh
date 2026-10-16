#!/bin/bash
# fetch mirokshi every 30 s, 10 times; record Date, X-Cache-Status, user_N id, csrf ts
V="${V:?set V to a scratch directory containing raw/}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
for i in $(seq 1 10); do
  curl -s --compressed -A "$UA" -D $V/raw/cp_$i.headers -o $V/raw/cprobe_$i.html https://mirokshi.itch.io/
  d=$(grep -i '^date' $V/raw/cp_$i.headers | tr -d '\r'); c=$(grep -i '^x-cache-status' $V/raw/cp_$i.headers | tr -d '\r'); s=$(head -1 $V/raw/cp_$i.headers | tr -d '\r')
  id=$(grep -oE 'id="user_[0-9]+"' $V/raw/cprobe_$i.html)
  echo -e "$i\t$s\t$d\t$c\t$id" | tee -a $V/raw/cacheprobe.tsv
  sleep 30
done
