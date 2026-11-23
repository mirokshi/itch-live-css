# Chapter 8 — Before you save: the final check

Work through this chapter every time you change your CSS, in order. Each step catches a different kind of failure, and the last ones are the ones people skip.

## 8.1 Measure the size

- **Profile:** 5,120 bytes or less, after trimming the start and end, comments included. Measure with the commands in chapter 1. [S1]
- **Project and devlog:** no practical limit, but paste one minified line. Count the line breaks too: on projects they are stored as two bytes each. [S1]
- **Jam:** keep it at 20,410 characters or less. That is the largest size known to save; the real cap has not been measured. [S2]

If you're over, the save is refused, not cut short. Nothing changes on your page until you fix the size. [S1]

## 8.2 Check the text itself

Before you paste, search your CSS for these:

- `<style` or `</style` anywhere, in any letter case, even inside a comment. itch deletes `</style>` and the CSS around it changes silently (R8). [S3]
- Any `@import` that is not on the first line, or any `@import` on a jam (R9). [S3]
- Selectors that don't start with `#wrapper` (R2), numbered IDs such as `#user_123` (R12), and `background` shorthands on `#wrapper` (R4). [S3]
- `@keyframes` names without the `custom-` prefix (R16). [S3]
- Hover effects outside `@media (hover: hover)` (R18), and `!important` on animated properties (R14). [S3]

If you have the itch-live-css validator, run it on the file for your page type. It checks most of the list above and reports the rule number for each problem. It can't check what a screen reader hears, or how the page looks. [S4]

## 8.3 Save, then check what visitors get

Saving is not the end. Check the saved page, logged out, after the cache has expired (about three minutes, chapter 7):

1. Open a private window, or log out.
2. Load the page and check it at **320 px** and **375 px**, plus the switch points for your page type (chapter 3).
3. Pages to check:
   - **Profile:** the main page.
   - **Project:** the main page, the `/devlog` index, one devlog post and `/comments`. All four share your sheet (R13).
   - **Jam:** the overview page.
4. Confirm the served CSS. Download the page as text and search it for `custom_css`, to check that your CSS arrived. The command below does that for a profile. Replace the placeholder with your own address and do not add `-L`, which follows redirects:

   ```bash
   curl -s https://YOUR-NAME.itch.io/ -o page.html && grep -c custom_css page.html
   ```

   A count of `1` or more means the element is there. [S5]

Logged-out checks are the ones that matter. Owners see extra headings and editor wrappers that visitors don't. [S6]

## 8.4 Accessibility and behaviour checks

Do these on the saved page, logged out:

- **Keyboard:** press Tab through the whole page. Every link and button should show a focus ring that is visible at 3:1 contrast or more (R19). [S7]
- **Reduced motion:** turn on "reduce motion" in your system settings. Nothing should move. [S8]
- **Contrast:** check text against the brightest part of your background image, not the background colour (chapter 4). [S9]
- **Forced colours:** turn on high-contrast mode. Cards should still have an outline. [S9]
- **Headings:** there should be exactly one `h1` that names the page, on profiles with a banner too (R20). Use the browser's accessibility tree to see what a screen reader gets. Text tools that read the page can include hidden text, so they are not enough. [S10]
- **Without the import:** if you use `@import`, check that the page still looks acceptable with it blocked (chapter 6, recipe 7). [S11]

## 8.5 What this guide's testing doesn't cover

Be honest with your visitors about what you have and haven't tested. The knowledge base tested these areas and not the others:

- **Browsers.** Only Chromium was run for the layouts and the techniques. Firefox and Safari behaviour was taken from public compatibility data, not tested on itch. Check your page in both before you call it finished. [S12]
- **Screen readers.** Speech output with a real screen reader was not tested. The accessibility tree was. [S12]
- **Jams.** The largest jam CSS known to save is 20,410 characters. The actual limit hasn't been measured. [S2]
- **Owner view.** Your own view can differ from what visitors see. Use it for editing only, and judge the result logged out. [S6]

## 8.6 Keep it working

itch changes its markup and its rules. A page that works today can break after an update, and nothing warns you. Build these habits:

- **A daily check.** One request a day to your logged-out profile that confirms the markup your CSS depends on is still there. Pick two or three selectors from your CSS and check that they still appear in the page. A simple script that fetches the page and searches for them is enough. [S13]
- **A changelog.** Each time you save, write one line: the date, what changed, the size in bytes, and the pages and browsers you checked. When something breaks later, that log tells you what changed last. [S14]
- **Re-check the guide.** The facts in this guide are dated. When itch changes something the guide describes, the chapter it belongs to should be updated and redated. [S14]

## 8.7 The final checklist

- [ ] Size measured: profile in bytes under 5,120; project or devlog as one line; jam under 20,410 characters.
- [ ] No `<style>` or `</style>` anywhere; `@import` first and pinned; no `@import` on a jam.
- [ ] Every selector starts with `#wrapper`; no numbered IDs; no `background` shorthand on `#wrapper`.
- [ ] `@keyframes` named `custom-…`; motion finite, under 5 seconds, ends at rest; reduced-motion block included.
- [ ] Hover effects inside `@media (hover: hover)`; keyboard focus shows a 3:1 ring.
- [ ] Saved, then checked logged out, after the cache expired, at 320 and 375 px.
- [ ] Every page type that shares your sheet checked (project: main, devlog, post, comments).
- [ ] One `h1`; contrast checked on the brightest part of the image; forced colours and reduced motion checked.
- [ ] Firefox and Safari checked, or the page says they weren't.
- [ ] Changelog line written.

---

## Sources

From the itch-live-css knowledge base, `knowledge/itch-custom-css.md` §1, §9 and §10 (the "Ship gate" and the headings table), plus chapters 1–7 of this guide.

- **S1** Size limits, bytes, trimming, line breaks: verified 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-A3a to live-cap-A3c, live-cap-B1, live-cap-B2.
- **S2** Jam cap: documented · crawljam-29; inferred · gapfill01-03. Not measured, per §1.
- **S3** Rules R2, R4, R8, R9, R12, R14, R16, R18: see chapter 2 sources.
- **S4** Validator: `engine validate()` covers R2–R12, R14–R16, R18 and R23 so far (R5, R6, R10 and R11 in part) (project notes). It does not check accessibility or the rendered page.
- **S5** Served-CSS check: verified · crawlprofile-58 (a GET with no `-L`, reading `style#custom_css`).
- **S6** Owner view and logged-out checks: observed · crawlprofile-43, a11y-21; verified · s10-17 (a live render with itch's script running is needed).
- **S7** Focus rings across Tab stops: verified · s04-gf-02, s04-gf-06, s04-gf-16.
- **S8** Reduced-motion block tested: verified · gapfill02-01, gapfill02-02, s10-02, repo-50.
- **S9** Contrast on the brightest image region; forced colours: verified · s10-06, s10-05, a11y-28.
- **S10** Headings and the accessibility tree: verified · a11y-03, a11y-57, localtests-34, a11y-50, repo-59.
- **S11** Page must work without the import: observed · repo-54; verified · localtests-12.
- **S12** Browser and screen-reader coverage: verified · s10-30, gapfill07-07; Firefox and Safari data documented · support-02.
- **S13** Daily markup check as a habit: the knowledge base's own watch workflow does this for one page (observed in the repo's `.github/workflows/watch.yml`); the advice to do it is this guide's.
- **S14** Dated facts and changelog: the knowledge base is dated and re-checked (for example the 2026-10-29 re-check of Chrome 156 and Firefox 159; support-62, support-63).
