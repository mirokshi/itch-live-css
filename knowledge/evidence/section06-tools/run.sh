#!/bin/sh
# Section 06 test runner (2026-10-14).
# Prereq: from the itch-live-css root run `python -m http.server 8090` and `python -m http.server 8091`
# (8091 = second origin for cross-origin @import tests).
# usage: run.sh <outdir> <chrome-profile-dir> a-import-cascade.html b-import-position.html ...
# then:  python -I parse.py <outdir>/*.html
OUT=$1; PROF=$2; shift 2
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
for p in "$@"; do
  "$CH" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROF" --virtual-time-budget=8000 --dump-dom "http://localhost:8090/knowledge/tests/$p" > "$OUT/$p" 2>/dev/null
done
