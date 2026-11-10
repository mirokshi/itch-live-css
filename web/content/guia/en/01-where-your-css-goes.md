# Chapter 1 — Where your CSS goes, and how much fits

Before writing a single rule you need to know three things: whether you can paste CSS at all, which pages it reaches, and how much of it itch will accept. Get these wrong and nothing else in this guide matters.

## 1.1 Do you have access?

Custom CSS is not on by default. itch staff turn it on by hand, account by account, after you ask through itch's support page. Accounts with nothing published are usually refused, and the wait can be weeks. [S1]

The quick test: open your page's theme editor (next section). If there is no **Custom CSS** field, you don't have access yet. Until you do, you still have the theme editor's colours and fonts, plus the HTML you can write in your bio or project description. [S1]

## 1.2 Finding the field

On your own page, while logged in:

1. Click **Edit theme**.
2. Open the **Misc** tab.
3. Paste into **Custom CSS**.
4. Click **Save**.

The **Edit theme** button disappears when the window is 980 px wide or narrower, so do this on a desktop-width window. [S2]

## 1.3 Which pages your CSS reaches

Each place you can paste CSS has its own field, and each field styles a fixed set of pages:

| Where you paste | Pages it styles |
|---|---|
| Your profile (`yourname.itch.io`) | The profile page only |
| A project | The project page **and** its `/devlog` index, every devlog post and the `/comments` page |
| A jam you host | The jam's overview page only |

Two consequences catch people out:

- **One project sheet, four kinds of page.** A rule meant for your game page also lands on your devlog posts. Chapter 2 shows how to aim a rule at one of them. [S3]
- **Some pages are never styled**: the purchase page, project boards and forums, collections, itch's blog, and the jam's entries, results, feed, community and rating pages. No CSS reaches them, whatever you do. [S3]

There is no JavaScript anywhere: itch doesn't allow it. Everything in this guide is pure CSS. [S3]

## 1.4 How much fits

| Page | Limit | What happens over it |
|---|---|---|
| Profile | **5,120 bytes** | Save refused, nothing changes |
| Project and devlog | No practical limit (over 650,000 characters saved) | A huge paste fails as a broken request |
| Jam | About 20 KB; 20,410 characters are known to work | Not measured |

[S4]

### The profile limit is in bytes, not characters

itch's error message says "characters", but it counts **bytes**. Plain English letters, digits and punctuation are one byte each. Accented letters such as `é` are two bytes, many symbols (`→`, `★`) are three, and emoji are four. So a profile sheet with accented text fits fewer characters than the 5,120 the message suggests. [S4]

Other details of the profile limit:

- **Comments count.** Strip them before pasting.
- **Spaces and line breaks at the very start and end don't count**, because itch trims them first.
- **Over the limit, the whole save is refused.** You get an error box saying your changes were not saved. itch never cuts your CSS short, so you won't end up with half a stylesheet, but you also won't get any of it. [S4]

### Measuring before you paste

Paste this into your browser's console (F12 → Console), put your CSS between the backticks, and press Enter:

```js
new TextEncoder().encode(String.raw`PASTE YOUR CSS HERE`.trim()).length
```

The number is the byte count itch will check. Keep it at 5,120 or under for a profile. If your CSS contains a backtick or `${`, use the Python version instead:

```sh
python -c "import sys;s=open(sys.argv[1],encoding='utf-8').read().strip();print(len(s),len(s.encode()))" my-profile.css
```

It prints characters, then bytes. [S5]

### Fitting more into a profile

- **Minify.** Remove comments, line breaks and spaces you don't need. Use a real CSS minifier. Some quick search-and-replace "minifiers" mangle the text inside `content:"…"`. [S6]
- **Write symbols as themselves.** A raw `→` costs 3 bytes; the escape that means the same thing costs 5. [S6]
- **Don't embed fonts or images as Base64.** Base64 inflates a file by about a third: a 2.5 KB font subset becomes 3.4 KB of CSS. [S6]
- **Still too big?** Host the rest as a file and load it with `@import`. Chapter 6 covers how to do that safely. It doesn't work on jams. [S6]

## 1.5 What itch does to your CSS when you save

itch keeps your CSS almost exactly as you typed it. It doesn't minify, check, fix or scope it. Only three things change: [S7]

1. **Every `</style>` is deleted**, in any letter case, even inside a comment or a string. If your CSS contains that text, the code around it changes silently. Never paste the `<style>` tags, only what goes between them. [S7]
2. **Spaces and line breaks at the start and end are trimmed.** [S7]
3. **Line breaks on a project are stored as two bytes (CRLF) instead of one.** It is harmless, but it is one more reason to paste project CSS as a single minified line. [S7]

When your CSS has a mistake, the browser skips the broken rule without telling you, and itch doesn't warn you either. Common silent failures:

- `calc(40px+10px)`: `calc` needs spaces around `+` and `-`.
- `//` comments: CSS has only `/* … */`.
- A missing `}`.
- One unknown selector in a list, which drops the whole rule. [S8]

Chapter 7 is about finding these.

## 1.6 Seeing your change

- **You** see your changes at once, and even see unsaved CSS while the editor is open. [S9]
- **Visitors** can keep seeing the old page for about two and a half minutes after a save, because itch caches it. Adding `?something` to the address doesn't skip the cache. [S9]

So always check the result **logged out**: in a private window, after a few minutes.

## Checklist

- [ ] The **Custom CSS** field is there (you have access).
- [ ] You know which pages your sheet reaches. On a project, that includes the devlog and comments.
- [ ] Profile CSS is **5,120 bytes or less**, measured as bytes, comments included.
- [ ] You pasted only CSS: no `<style>` tags, no `</style>` anywhere.
- [ ] Project CSS is one minified line.
- [ ] You checked the saved page logged out, after the cache had expired.

---

## Sources

Every claim above maps to a fact in the itch-live-css knowledge base (`knowledge/itch-custom-css.md`, §0–§1). "Verified" means it was reproduced directly; dated entries come from live tests on itch.io in October 2026.

- **S1** Access by request, missing field = no access: documented · docs-01, docs-02, docs-03, community-48.
- **S2** Editor path, button hidden at ≤ 980 px: observed · gapfill01-07; verified · gapfill01-08.
- **S3** Pages styled and not styled, no JavaScript: verified · s01-n2, crawlproject-42, crawljam-03, crawljam-35, crawljam-44; documented · docs-05, repo-04.
- **S4** Size limits, bytes not characters, comments count, edges trimmed, refusal message: verified 2026-10-16 · live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a to live-cap-A3c, live-cap-B1, live-cap-B2; jam: documented · crawljam-29; inferred · gapfill01-03.
- **S5** Measuring script: verified · s01-n8. The console one-liner is this guide's own and counts the same way (trimmed text, UTF-8 bytes); `String.raw` keeps backslashes such as `\2192` intact.
- **S6** Byte-saving tips: verified · corpus-19, s01-n6, x08-06, community-11; documented · docs-32.
- **S7** What a save changes: verified 2026-10-16 · live-c01 to live-c45, live-css; verified · corpus-01, corpus-02, corpus-03, gapfill01-02.
- **S8** Silent failures: verified · localtests-41, localtests-42, support-08.
- **S9** Preview and cache: documented · community-05; verified · crawlprofile-46; verified 2026-10-16 · live-dom.
