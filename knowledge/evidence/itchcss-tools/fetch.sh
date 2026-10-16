#!/bin/sh
# usage: WORK=<workdir> fetch.sh   -- downloads the sample pages + itch CSS bundles into $WORK/raw (NOT into the repo)
# Etiquette: GET only, browser UA, >=5 s between requests (itch answers 429 from openresty when hit faster,
# especially when other crawlers share the IP). Retry a 429 once after 30 s.
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
mkdir -p "$WORK/raw"; cd "$WORK/raw" || exit 1
get(){ sleep 5; curl -s --compressed -A "$UA" -D "$1.headers" -w "$1 %{http_code}\n" "$2" -o "$1"; }
get profile_mirokshi.html https://mirokshi.itch.io/
get profile_leafo.html    https://leafo.itch.io/
get project_xmoon.html    https://leafo.itch.io/x-moon
get project_deltarune.html https://tobyfox.itch.io/deltarune
get devlog_post.html      https://creator-58.itch.io/game-23/devlog/<id>/<post>
get devlog_index.html     https://creator-58.itch.io/game-23/devlog
get dl_7.html             https://creator-43.itch.io/game-07/devlog/<id>/<post>
get project_cbr.html      https://creator-43.itch.io/game-07
for j in lve-jam-2026-b-side metroidvania-month-34 gdevelop-big-game-jam-10 women-game-jam-2026 trijam-394 witchcraft-jam; do get jam_$j.html https://itch.io/jam/$j; done
get jam_entries_mm34.html https://itch.io/jam/metroidvania-month-34/entries
V=$(grep -o 'static.itch.io/user.css?[0-9]*' profile_mirokshi.html | head -1 | cut -d? -f2)
for c in user game jam main theme_editor; do get $c.css "https://static.itch.io/$c.css?$V"; done
