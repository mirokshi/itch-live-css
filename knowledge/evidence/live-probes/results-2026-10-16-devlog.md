# Live probe results: devlog post, 2026-10-16

Kit v1 (2026-10-14), Run 3 (devlog part), filled in from [`probe-report-devlog-post-2026-10-16.json`](probe-report-devlog-post-2026-10-16.json). The baseline is the project run, [results-2026-10-16-project.md](results-2026-10-16-project.md): same browser, same payloads, same draft project.

**Scope.** A **draft devlog post** of the draft project, its **body** (full 155-probe set, `probe-description.html`, pasted in HTML mode and saved as a draft), and the **project's Custom CSS** as served on that post (`probe.css`, saved earlier on the project). Owner logged in, Brave 155 (Chromium 155), Windows. Jams remain untested.

## 0. Headline results

1. **The devlog body uses the project-description sanitizer**: 147 of 155 probes have exactly the project's outcome and details, including the `custom` prefix test, the attribute and inline-style lists, escaped tags, links, images and the raw-`<` gotchas (e07, e08: `x99` again ends up outside the container).
2. **The 8 differences are the iframes: they stay live on a devlog post**, with no click-to-activate placeholder (10 iframes, 0 placeholders). i01 keeps the same attributes dropped as on the project; i02–i07 and i10 survive whole; i08 and i09 lose `srcdoc` and the `data:` src as on the project.
3. **Container:** `section#object_text_widget_N.object_text_widget_widget.base_widget.user_formatted.post_body`. It has `.user_formatted`, so the hand-written spoiler is hidden, as on the project.
4. **The project CSS is served on the post unchanged**: `style#custom_css` with the same stored text as on the project page (2,752 characters, 52 CR, both ends trimmed, `</style>` deleted), and all 46 CSS probes have the same outcome and `applied` value.
5. **Page facts:** `data-page_name` `game.devlog_post`; `#wrapper` sits directly under `body` (no theme-editor columns); no *Edit theme* button on the post; three `static.itch.io` links before `style#game_theme` and `style#custom_css`; no CSP header, `X-Frame-Options: SAMEORIGIN`.

## 1. Run facts

| Field | Value |
|---|---|
| Date and time (UTC) | 2026-10-16 20:56:21 |
| Page type (`page.type`, `page.pageName`) | devlog-post, `game.devlog_post` |
| Visibility | draft post of a draft project |
| HTML field and payload | devlog post body, `probe-description.html` (18,092 chars), pasted from the clipboard after a byte check, HTML mode |
| CSS | the project's Custom CSS (`probe.css`), not re-saved for this run |
| Viewer | owner logged in |
| Browser, viewport | Brave 155, Chromium 155, 2560x638, DPR 1, dark True |
| Owner view (`page.ownerView`) | `{"editThemeBtn": 0, "ownerTools": 1, "gameHeaderWidget": 1, "themeEditorColumns": 0, "bodyThemeEditorOpen": false}` |
| Warnings | none |

## 2. CSS sheet

| Item | Devlog post | Project page (Run 1) |
|---|---|---|
| Block | `custom_css` | `custom_css` |
| Stored chars / bytes / CR / LF | 2752 / 2768 / 52 / 52 | 2752 / 2768 / 52 / 52 |
| Leading / trailing whitespace | `""` / `""` | same |
| Style element closed early | False | False |
| 46 CSS probes | identical outcome, applied and value to the project run | — |

## 3. HTML probes that differ from the project description

All other 147 probes are identical to the project run (outcome and details).

| Id | Probe | Devlog post | Project description |
|---|---|---|---|
| i01 | youtube, all attributes | stripped: `<iframe.custom-i01x>` @title dropped; `<iframe.custom-i01x>` @allow dropped; `<iframe.custom-i01x>` @loading dropped; `<iframe.custom-i01x>` @sandbox dropped; `<iframe.custom-i01x>` @referrerpolicy d | rewritten: `<iframe.custom-i01x>` replaced by click-to-activate placeholder button.embed_preload.youtube_preload; <iframe.custom-i01x… |
| i02 | youtube-nocookie | survived | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed… |
| i03 | vimeo | survived | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed… |
| i04 | arbitrary https host | survived | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed… |
| i05 | github pages host | survived | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed… |
| i06 | http host | survived | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed… |
| i07 | protocol-relative | survived | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed… |
| i10 | codepen host | survived | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed… |

## 4. Live behaviour and page facts

| Item | Value |
|---|---|
| Container | `section#object_text_widget_N.object_text_widget_widget.base_widget.user_formatted.post_body` |
| Served size | 17569 raw chars from the container tag to the end marker (container innerHTML 16857, 155 CR) for 18,092 sent |
| Probes outside the container | x99 |
| `liveContainer.iframes` / `placeholders` | 10 / 0 |
| Spoiler k34 | tabindex `0`, text fill `rgba(0, 0, 0, 0)`, colour and background `rgb(34, 34, 34)`: hidden |
| `:target` on `a[name]` (l10) / authored id (a01) | matches :target / element absent |
| Body classes | `"has_site_header locale_en game_layout_widget layout_widget responsive no_theme_toggle"` |
| `#wrapper` ancestors | `["div#wrapper.main.wrapper.game_page_wrapper", "body.has_site_header.locale_en.game_layout_widget.layout_widget.responsive.no_theme_toggle"]` |
| Body children | `["div#game_header_N.small_logo.game_header_widget.header_widget.base_widget.gray", "div#wrapper.main.wrapper.game_page_wrapper", "script", "script#loading_lightbox_tpl", "script"]` |
| Stylesheets | `["link static.itch.io", "link static.itch.io", "link static.itch.io", "style#game_theme", "style#custom_css"]` |
| After `#custom_css` | `[]` |
| Inline styles | `{"wrapper": null, "innerColumn": "min-height: 548px;"}` |
| Theme block | `style#game_theme`, 4649 chars; `#inner_column.size_large.family_lato`; no `#header` |
| Response headers (owner) | `{"content-type": "text/html", "cache-control": "no-store", "x-cache-status": "BYPASS", "x-frame-options": "SAMEORIGIN", "vary": "accept-encoding"}` |

## 5. Knowledge-base updates

| Claim | Old tag | New tag or correction | Probe id |
|---|---|---|---|
| Devlog iframes stay live | observed · sanitizer-25, gapfill05-08 | verified on a devlog post | live-i01 to live-i10 |
| Devlog body sanitized like project descriptions | inferred / project-only live tags | verified on a devlog post (147 of 155 identical; only iframes differ) | live-html |
| Devlog container `section.post_body` | observed · N1 | verified, full class list and `.user_formatted` | live-html, live-k34 |
| Project CSS served on devlog posts unchanged | verified · crawlproject | verified on a draft post | live-css |

## 6. Before committing

- [x] JSON report reviewed: no csrf token, e-mail address or personal data; the subdomain is redacted.
- [x] No `saveRaw()` file was made.
- [ ] The draft post still holds the probe body; delete it or keep it for later runs.
