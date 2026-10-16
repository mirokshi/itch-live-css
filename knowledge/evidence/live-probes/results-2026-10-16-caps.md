# Live probe results: size caps, 2026-10-16 (Run 4)

Owner logged in, Brave 155. Generator and reader from `../../probes/probe-cap.md`, run as a DevTools snippet. One row per save, in the order made (including the mistakes). Tags in the knowledge base: `[verified 2026-10-16 · live-cap-<step>]`.

## Summary

| Step | Result | Rows |
|---|---|---|
| A1, A4 | **Profile CSS cap: 5,120.** 5,120 ASCII saves, 5,121 is refused with a lightbox ("We encountered an error" / "css: expected empty, or text between 1 and 5120 characters" / "Your changes were not saved, please try again"); nothing is truncated | 1, 30, 31 |
| A2 | **Unit: UTF-8 bytes**, despite the message. 5,120 `é` (10,240 bytes) refused; 2,603 `é` (5,120 bytes) saves, 2,604 `é` (5,122 bytes) refused. A2b (emoji) skipped: a byte cap already decides it | 32–34 |
| A3 | Comments count (5,121 in a comment refused); leading and trailing whitespace are trimmed before the check (5,120 + 5 whitespace saves either way) | 35–38 |
| B | **Project CSS: no cap.** 659,742 single-line ASCII characters save whole; 659,743 and up fail with "missing token" (request-size failure, not a CSS rule; reload ruled out an expired token) | 3–28 |
| D1 | **Bio cap: 5,000 characters** (ASCII). 5,001 refused with an inline error on the edit page: "Errors:" / "data: profile: expected text between 1 and 5000 characters, or empty" | 41, 42 |
| D2 | The bio cap counts the **submitted** HTML: a 4,990-character bio with 10 links saved and is served at 5,470 characters | 43 + note |
| C | Jam cap: not run (no draft jam) | — |

Kit issue found: `capReadBio()` reads the first copy of the bio, which on the owner's page is an HTML-escaped copy of the submitted source; run it logged out or skip that copy.

## Log

| # | Page | Call | Generator: code points / UTF-16 / bytes / LF | Verdict | Lightbox text (exact) | Stored (capRead) | Notes |
|---|---|---|---|---|---|---|---|
| 1 | profile | `capCss(40000)` | 40,000 / 40,000 / 40,000 / 0 | refused with an error | Title "We encountered an error"; body "css: expected empty, or text between 1 and 5120 characters"; footer "Your changes were not saved, please try again" | not read; the profile kept its previous CSS | Meant for the project; made on the profile by mistake |
| 2 | profile | `capCss(40000)` again | 40,000 / 40,000 / 40,000 / 0 | refused with an error | same lightbox as #1 | not read; profile unchanged | Second try on the profile; same result |
| 3 | project (draft) | `capCss(40000)` | 40,000 / 40,000 / 40,000 / 0 | **accepted** | none | `custom_css`, head = tail = `40000-61-s`, 40,000 code points / 40,000 bytes, 0 CR, 0 LF, stored whole | |
| 4 | project (draft) | `capCss(60000)` | 60,000 / 60,000 / 60,000 / 0 | **accepted** | none | `custom_css`, head = tail = `60000-61-s`, 60,000 code points / 60,000 bytes, 0 CR, 0 LF, stored whole | |
| 5 | project (draft) | `capCss(100000)` | 100,000 / 100,000 / 100,000 / 0 | **accepted** | none | `custom_css`, head = tail = `100000-61-s`, 100,000 code points / 100,000 bytes, 0 CR, 0 LF, stored whole | |
| 6 | project (draft) | `capCss(200000)` | 200,000 / 200,000 / 200,000 / 0 | **accepted** | none | `custom_css`, head = tail = `200000-61-s`, 200,000 code points / 200,000 bytes, 0 CR, 0 LF, stored whole | |
| 7 | project (draft) | `capCss(500000)` | 500,000 / 500,000 / 500,000 / 0 | **accepted** | none | `custom_css`, head = tail = `500000-61-s`, 500,000 code points / 500,000 bytes, 0 CR, 0 LF, stored whole | |
| 8 | project (draft) | `capCss(1000000)` | 1,000,000 / 1,000,000 / 1,000,000 / 0 | refused with an error | Title "We encountered an error"; body "missing token"; footer "Your changes were not saved, please try again" | not read yet | First save made without reloading the page after the previous save; "missing token" suggests the form's csrf field was not parsed (request too large) or an expired token |
| 9 | project (draft) | `capCss(1000000)` after F5 | 1,000,000 / 1,000,000 / 1,000,000 / 0 | refused with an error | same "missing token" lightbox as #8 | not read | Reload ruled out an expired token: the request is too large for the form to be read (no CSS cap message) |
| 10 | project (draft) | `capCss(750000)` | 750,000 / 750,000 / 750,000 / 0 | refused with an error | "missing token" (as #8) | not read | Bisection 500,000–1,000,000 |
| 11 | project (draft) | `capCss(650000)` (625,000 was intended) | 650,000 / 650,000 / 650,000 / 0 | **accepted** | none | `custom_css`, head = tail = `650000-61-s`, 650,000 code points / 650,000 bytes, 0 CR, 0 LF, stored whole | Bisection: limit between 650,000 and 750,000 |
| 12 | project (draft) | `capCss(700000)` | 700,000 / 700,000 / 700,000 / 0 | refused with an error | "missing token" (as #8) | not read | Bisection: limit between 650,000 and 700,000 |
| 13 | project (draft) | `capCss(675000)` | 675,000 / 675,000 / 675,000 / 0 | refused with an error | "missing token" (as #8) | not read | Bisection: limit between 650,000 and 675,000 |
| 14 | project (draft) | `capCss(662500)` | 662,500 / 662,500 / 662,500 / 0 | refused with an error | "missing token" (as #8) | not read | Bisection: limit between 650,000 and 662,500 |
| 15 | project (draft) | `capCss(655360)` (656,250 was suggested; the owner tested 640 KiB) | 655,360 / 655,360 / 655,360 / 0 | **accepted** | none | `custom_css`, head = tail = `655360-61-s`, 655,360 code points / 655,360 bytes, 0 CR, 0 LF, stored whole | Limit between 655,360 and 662,500. The whole request (CSS plus the other form fields) was over 640 KiB and still accepted, so a 640 KiB body limit is ruled out |
| 16 | project (draft) | `capCss(658930)` | 658,930 / 658,930 / 658,930 / 0 | **accepted** | none | `custom_css`, head = tail = `658930-61-s`, 658,930 code points / 658,930 bytes, 0 CR, 0 LF, stored whole | Bisection continued: limit between 658,930 and 662,500 |
| 17 | project (draft) | `capCss(660715)` | 660,715 / 660,715 / 660,715 / 0 | refused with an error | "missing token" (as #8) | not read | Limit between 658,930 and 660,715 |
| 18 | project (draft) | `capCss(659822)` | 659,822 / 659,822 / 659,822 / 0 | refused with an error | "missing token" (as #8) | not read | Limit between 658,930 and 659,822 |
| 19 | project (draft) | `capCss(659376)` | 659,376 / 659,376 / 659,376 / 0 | **accepted** | none | `custom_css`, head = tail = `659376-61-s`, 659,376 code points / 659,376 bytes, 0 CR, 0 LF, stored whole | Limit between 659,376 and 659,822 |
| 20 | project (draft) | `capCss(659599)` | 659,599 / 659,599 / 659,599 / 0 | **accepted** | none | `custom_css`, head = tail = `659599-61-s`, 659,599 code points / 659,599 bytes, 0 CR, 0 LF, stored whole | Limit between 659,599 and 659,822 |
| 21 | project (draft) | `capCss(659710)` | 659,710 / 659,710 / 659,710 / 0 | **accepted** | none | `custom_css`, head = tail = `659710-61-s`, 659,710 code points / 659,710 bytes, 0 CR, 0 LF, stored whole | Limit between 659,710 and 659,822 |
| 22 | project (draft) | `capCss(659766)` | 659,766 / 659,766 / 659,766 / 0 | refused with an error | "missing token" (as #8) | not read | Limit between 659,710 and 659,766 |
| 23 | project (draft) | `capCss(659738)` | 659,738 / 659,738 / 659,738 / 0 | **accepted** | none | `custom_css`, head = tail = `659738-61-s`, 659,738 code points / 659,738 bytes, 0 CR, 0 LF, stored whole | Limit between 659,738 and 659,766 |
| 24 | project (draft) | `capCss(659752)` | 659,752 / 659,752 / 659,752 / 0 | refused with an error | "missing token" (as #8) | not read | Limit between 659,738 and 659,752 |
| 25 | project (draft) | `capCss(659745)` | 659,745 / 659,745 / 659,745 / 0 | refused with an error | "missing token" (as #8) | not read | Limit between 659,738 and 659,745 |
| 26 | project (draft) | `capCss(659741)` | 659,741 / 659,741 / 659,741 / 0 | **accepted** | none | `custom_css`, head = tail = `659741-61-s`, 659,741 code points / 659,741 bytes, 0 CR, 0 LF, stored whole | Limit between 659,741 and 659,745 |
| 27 | project (draft) | `capCss(659743)` | 659,743 / 659,743 / 659,743 / 0 | refused with an error | "missing token" (as #8) | not read | Limit between 659,741 and 659,743 |
| 28 | project (draft) | `capCss(659742)` | 659,742 / 659,742 / 659,742 / 0 | **accepted** | none | `custom_css`, head = tail = `659742-61-s`, 659,742 code points / 659,742 bytes, 0 CR, 0 LF, stored whole | **Boundary found: 659,742 accepted, 659,743 refused** |

**Part B, final:** the largest single-line ASCII CSS that saved on the draft project is **659,742 characters** (= bytes); 659,743 fails with "missing token" (#27). This is a request-size boundary, not a CSS rule: it shows up as a missing csrf token, and the exact number depends on the rest of the form (token, theme fields) and on how the text is encoded in the request, so CSS with multi-byte characters or many characters that need escaping would hit it sooner [inferred]. Nothing close to this size is useful in practice.

**Cleanup:** `probe.css` saved back on the draft; `capRead()` reports "no cap test CSS stored" with 2,752 code points, 52 CR and 52 LF, as in Run 1.

## Part A: profile CSS

The public profile matched the backup before starting (checked logged out).

| # | Page | Call | Generator: code points / UTF-16 / bytes / LF | Verdict | Lightbox text (exact) | Stored (capRead) | Notes |
|---|---|---|---|---|---|---|---|
| 29 | profile | `capCss(5120)` | 5,120 / 5,120 / 5,120 / 0 | not stored | none reported | original CSS (4,725 code points), "no cap test CSS stored" | Probably not pasted or saved; repeated as #30 |
| 30 | profile | `capCss(5120)` again | 5,120 / 5,120 / 5,120 / 0 | **accepted** | none | `custom_css`, head = tail = `5120-61-s`, 5,120 code points / 5,120 bytes, 0 CR, 0 LF, stored whole | A1 |
| 31 | profile | `capCss(5121)` | 5,121 / 5,121 / 5,121 / 0 | refused with an error | same lightbox as #1: "css: expected empty, or text between 1 and 5120 characters" | not read (the profile kept `5120-61-s`) | **A1: C = 5,120** for ASCII |
| 32 | profile | `capCss(5120, 'é')` | 5,120 code points / 5,120 UTF-16 / about 10,200 bytes / 0 | refused with an error | same lightbox as #1 ("…between 1 and 5120 characters") | not read (profile kept `5120-61-s`) | **A2a refused**: the cap is not on code points; bytes are the likely unit (A2c next) |
| 33 | profile | `capCss(2603, 'é')` | 2,603 / 2,603 / 5,120 / 0 | **accepted** | none | `custom_css`, head = tail = `2603-e9-s`, 2,603 code points / 5,120 bytes, 0 CR, 0 LF, stored whole | A2c |
| 34 | profile | `capCss(2604, 'é')` | 2,604 / 2,604 / 5,122 / 0 | refused with an error | same lightbox as #1 | not read | **A2c: the profile cap is 5,120 UTF-8 bytes**, although the message says "characters". A2b (emoji) skipped: a byte cap already decides it |
| 35 | profile | `capCss(5120, 'a', 'comment')` | 5,120 / 5,120 / 5,120 / 0 | **accepted** | none | `custom_css`, head = tail = `5120-61-c`, 5,120 code points / 5,120 bytes, 0 CR, 0 LF, stored whole | A3a, step 1 |
| 36 | profile | `capCss(5121, 'a', 'comment')` | 5,121 / 5,121 / 5,121 / 0 | refused with an error | same lightbox as #1 | not read (profile kept `5120-61-c`) | **A3a: comments count** like any other text |
| 37 | profile | `capCss(5120)` + two LF and three spaces at the end (5,125 code points / 5,125 bytes sent) | 5,120 + 5 trailing whitespace | **accepted** | none | `custom_css`, head = tail = `5120-61-s`, 5,120 code points / 5,120 bytes, 0 LF: the trailing whitespace is gone | **A3b: trailing whitespace is trimmed before the cap is checked** |
| 38 | profile | two LF and three spaces + `capCss(5120)` (5,125 code points / 5,125 bytes sent) | 5 leading whitespace + 5,120 | **accepted** | none | `custom_css`, head = tail = `5120-61-s`, 5,120 code points from the head marker, stored whole (`capRead()` measures from the head marker, so it can't show leading text) | **A3c: leading whitespace does not count** either; Run 2 already showed it is removed from storage |

**Part A result:** the profile CSS cap is **5,120 UTF-8 bytes** (not characters, despite the message), checked after trimming leading and trailing whitespace; comments count. Over the cap the save is refused with the lightbox "We encountered an error / css: expected empty, or text between 1 and 5120 characters / Your changes were not saved, please try again"; nothing is truncated.

## Part D: profile bio HTML

| # | Page | Call | Sent: code points / bytes | Verdict | Lightbox text (exact) | Stored (capReadBio) | Notes |
|---|---|---|---|---|---|---|---|
| 39 | ~~profile bio~~ profile **Custom CSS** (pasted into the wrong field) | `capBio(5000)` | 5,000 / 5,000 | void for D | none | `capReadBio()` found the markers inside `style#custom_css` | Not a bio result: the bio HTML was saved into the CSS field, which accepted it (under 5,120 bytes) |
| 40 | ~~profile bio~~ profile **Custom CSS** (wrong field) | `capBio(5001)` | 5,001 / 5,001 | void for D | none | markers found inside `style#custom_css` | Not a bio result; D restarts at #41 |
| 41 | profile bio (HTML mode) | `capBio(5000)` | 5,000 / 5,000 | **accepted** | none | head = tail = `5000-0`, head-to-tail 4,993 code points (`<p>` before the head marker is not counted), `injectedRel` 0, stored whole | D1, in the bio field |
| 42 | profile bio (HTML mode) | `capBio(5001)` | 5,001 / 5,001 | refused with an error | Inline on the edit-profile page, not a lightbox: "Errors:" then "data: profile: expected text between 1 and 5000 characters, or empty" | not read; the bio kept `5000-0` | **D1: B = 5,000** (ASCII) |
| 43 | profile bio (HTML mode) | `capBio(4990, 10)` (10 off-site links) | 4,990 / 4,990 (4,983 from head to tail) | **accepted** | none | head = tail = `4990-10`, head-to-tail **5,203** code points (+220, i.e. +22 per link), `injectedRel` **0**, stored whole | **D2: the cap counts the submitted HTML**, not the served one (5,203 > 5,000). See the note below |

**Note on #43.** The owner's page holds two copies of the bio. `capReadBio()` read the first one, an HTML-escaped copy of the submitted source (`&lt;a href=&quot;…&quot;&gt;` is exactly 22 characters longer per link, and it has no `rel`), placed before the rendered bio; that copy is probably the editor's data [inferred]. The rendered bio carries `rel="nofollow noopener" referrerpolicy="origin"` on every link (owner console). A logged-out GET right after (`X-Cache-Status: MISS`) has a single copy, inside `div.user_profile.formatted`: head to tail **5,463** characters (+48 per link), with the attributes in the order `referrerpolicy`, `rel`. So the served bio was 5,470 characters with its `<p>` and still saved: **the bio cap (5,000) counts the submitted HTML**. Kit fix for later: `capReadBio()` should skip the escaped copy or be run logged out.
