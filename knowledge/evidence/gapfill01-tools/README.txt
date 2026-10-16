gapfill01-tools: own scripts for the 01-how-it-works gap fill (2026-10-14). See knowledge/evidence/gapfill.md,
block "Gap fill for 01-how-it-works.md". Scripts print sizes, hashes and computed styles only, never CSS text.
- fetch.sh            polite GET (desktop UA, 3 s pause), logs to $OUTDIR/requests.log
- blockstats.py       bytes/chars/UTF-16/CR/LF/sha1 of style#custom_css, #jam_theme, #game_theme, #user_theme
- matchsrc.py         live style#custom_css vs. source files (one per git commit), CRLF->LF + trailing trim
- jamsplit.py         jam_theme = generated part + host CSS (+ the space itch appends); host stats
- jsharness.py        JS-ENABLED jam harness: keeps scripts, points lib/bundle/jam .min.js + jam.css at local copies
- jamfocus.mjs        Tab through a harness; per stop: region, AX role/name, :focus-visible, outline, opacity-hidden
- focussum.py         per-region summary of jamfocus output
- probe.mjs           skip-link target, focused .game_cell_tools opacity, .itch_footer facts
- fixprobe.mjs        appends candidate fixes after the host CSS and counts ring-less / invisible stops
- varprobe.mjs        #wrapper{--itchio_input_focus_color} effect on link / tab / .button rings (focus emulation on)
- ownerview.mjs       simulates the documented owner-view wrappers (.theme_editor_columns ...) with itch's jam.css
- newline.mjs + newline-test.html  textarea.value vs JSON vs itch's jQuery serializeArray newline handling
Chrome: chrome --headless=new --remote-debugging-port=9612 --user-data-dir=<scratch>/chrome-prof about:blank
Run the .mjs files with CDP_PORT=9612 CDP_BLOCK_ITCH=1 node <script> file:///<abs path> ...
- ringfix.mjs         Tab through with/without the recommended focus-ring + entry-tools snippet; rings per element kind
