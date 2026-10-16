# Finding the editor caps (probe-cap)

Kit v1, 2026-10-14. This procedure settles questions the main probes cannot:

- the exact size cap of the profile CSS editor;
- whether that cap counts characters, UTF-8 bytes or UTF-16 units;
- whether comments, whitespace and line breaks count;
- what an over-cap save does: refusal with an error, silent refusal, or truncation;
- whether project and devlog CSS has any cap, and the exact jam cap;
- the profile bio's HTML cap, and whether it counts the HTML you sent or the HTML after itch adds attributes.

The knowledge base currently says: profile "5kb", believed to be 5,120 characters, never tested at the boundary; projects took 38,560 characters with no cap seen; jams "20kb", with 20,410 characters known to save. See `../sections/01-how-it-works.md` §3.

## Before you start

1. **Back up what is there now.** Copy the current Custom CSS (and, for the bio test, the bio HTML in `<>` mode) into local files. You will paste them back at the end.
2. **Use the right page.** The profile cap can only be measured on the profile, so the profile loses its custom look while you test; keep the session short. Run project tests on a **draft** project. Run jam tests only on a draft jam you host.
3. **Go slowly.** One save, one read-back, then the next. A few seconds between saves is plenty.
4. **Paste the two snippets below into the DevTools console** of the page you are testing. They stay defined until you reload, so paste them again after each reload.

### Snippet 1: the generator

`capCss(n)` builds a stylesheet of exactly `n` characters (Unicode code points) and copies it to the clipboard. The same tag is written at the start (`--cap-head`) and at the end (`--cap-tail`), so a truncated save is visible.

```js
// probe-cap generator (kit v1). Paste into the DevTools console. Nothing is sent anywhere.
// capCss(n, fill, pad, lines)
//   n     total length in code points
//   fill  one character for the padding: 'a' (1 UTF-8 byte), 'é' (2), '→' (3), '😀' (4 bytes, 2 UTF-16 units)
//   pad   'string' (padding inside a custom-property string, the default) or 'comment' (inside /* */)
//   lines how many line breaks (LF) to spread through the padding (default 0)
// capBio(n, links) builds bio HTML of exactly n code points, with `links` off-site links that itch
//   will lengthen with rel="nofollow noopener" referrerpolicy="origin".
function capMeasure(s) {
  return { codePoints: Array.from(s).length, utf16: s.length, utf8Bytes: new TextEncoder().encode(s).length, lf: s.split('\n').length - 1 };
}
function capOut(s, label) {
  globalThis.lastCap = s;
  let copied = false;
  try { if (typeof copy === 'function') { copy(s); copied = true; } } catch (e) {}
  const m = capMeasure(s);
  console.log(label, m, copied ? 'copied: paste it and save' : 'run copy(lastCap) to copy it');
  return m;
}
function capCss(n, fill = 'a', pad = 'string', lines = 0) {
  if (Array.from(fill).length !== 1 || fill === '*' || fill === '"' || fill === '\\') throw new Error('fill must be one safe character');
  const tag = n + '-' + fill.codePointAt(0).toString(16) + '-' + pad[0] + (lines ? '-l' + lines : '');
  const head = '#wrapper{--cap-head:"' + tag + '"}';
  const tail = '#wrapper{--cap-tail:"' + tag + '"}';
  const open = pad === 'comment' ? '/*' : '#wrapper{--cap-pad:"';
  const close = pad === 'comment' ? '*/' : '"}';
  if (lines && pad !== 'comment') throw new Error('line breaks need pad = "comment"');
  const k = n - Array.from(head + open + close + tail).length - lines;
  if (k < lines) throw new Error('n is too small');
  let body = fill.repeat(k);
  if (lines) { const step = Math.floor(k / (lines + 1)); const cp = Array.from(body); for (let i = lines; i >= 1; i--) cp.splice(i * step, 0, '\n'); body = cp.join(''); }
  return capOut(head + open + body + close + tail, 'capCss ' + tag);
}
function capBio(n, links = 0) {
  const tag = n + '-' + links;
  const head = '<p>[cap-bio-head ' + tag + '] ';
  const tail = ' [cap-bio-tail ' + tag + ']</p>';
  const link = '<a href="https://example.com/">x</a> ';
  const k = n - Array.from(head + tail).length - links * link.length;
  if (k < 0) throw new Error('n is too small');
  return capOut(head + link.repeat(links) + 'a'.repeat(k) + tail, 'capBio ' + tag);
}
```

### Snippet 2: the reader

Run `capRead()` (CSS) or `capReadBio()` (bio) on the page itself, with the theme editor closed, after every save. It makes one same-origin GET of the page and reports what the server stored.

```js
// probe-cap reader (kit v1). One GET of this page's own URL; read-only. Works without snippet 1.
function capMeasure(s) {
  return { codePoints: Array.from(s).length, utf16: s.length, utf8Bytes: new TextEncoder().encode(s).length, lf: s.split('\n').length - 1 };
}
async function capFetch() {
  return (await fetch(location.href.split('#')[0], { credentials: 'include', cache: 'no-store' })).text();
}
async function capRead() {
  const raw = await capFetch();
  const m = raw.match(/<style\b[^>]*\bid=["']?(custom_css|jam_theme)\b[^>]*>([\s\S]*?)<\/style/i);
  if (!m) { console.log('no style#custom_css or style#jam_theme: the stored CSS is empty'); return null; }
  const t = m[2], from = t.indexOf('#wrapper{--cap-head'), part = from < 0 ? t : t.slice(from);
  const get = (re) => (part.match(re) || [])[1] || null;
  const r = Object.assign({ block: m[1], head: get(/--cap-head:"([^"]*)"/), tail: get(/--cap-tail:"([^"]*)"/), cr: part.split('\r').length - 1 }, capMeasure(part));
  r.verdict = !r.head ? 'no cap test CSS stored' : r.tail === r.head ? 'stored whole' : 'TRUNCATED (head without tail)';
  console.log(r);
  return r;
}
async function capReadBio() {
  const raw = await capFetch();
  const h = raw.match(/\[cap-bio-head ([^\]]*)\]/);
  if (!h) { console.log('no cap-bio text on this page'); return null; }
  const i = raw.indexOf(h[0]), rest = raw.slice(i), t = rest.match(/\[cap-bio-tail ([^\]]*)\]/);
  const stored = t ? rest.slice(0, rest.indexOf(t[0]) + t[0].length) : null;
  const r = { head: h[1], tail: t ? t[1] : null, storedHeadToTail: stored ? capMeasure(stored) : null,
    injectedRel: (stored || rest.slice(0, 20000)).split('rel="nofollow noopener"').length - 1 };
  r.verdict = t && t[1] === h[1] ? 'stored whole' : 'TRUNCATED or tail missing';
  console.log(r);
  return r;
}
```

`storedHeadToTail` is measured on the served HTML, so it includes what itch added. The generated text before the head marker (`<p>`) is not counted.

## How to classify one attempt

After each **Save**, before reading anything:

- If a lightbox appears, copy its **exact** title and text ("Your changes were not saved, please try again" plus whatever it lists).
- Reload the page with the editor closed and run `capRead()`.

| What you see | Verdict |
|---|---|
| No lightbox, `head` = this attempt's tag, `verdict: stored whole`, `codePoints` = n | **accepted** |
| Lightbox with an error, `head` still shows the previous attempt | **refused with an error** (record the text) |
| No lightbox, `head` still shows the previous attempt | **refused silently** |
| `head` = this attempt's tag, `verdict: TRUNCATED` | **truncated**: the stored `codePoints` / `utf8Bytes` is the cap |

The `cr` value tells you how line breaks were stored: CRLF on project pages, LF on profiles and jams (`../sections/01-how-it-works.md` §3).

## A. Profile CSS cap (expected about 5,120)

Run on the profile. Each line is one attempt: generate, paste into Edit theme → Misc → Custom CSS (replace everything), Save, read back.

**A1. Boundary, ASCII.**

1. `capCss(5120)`, then `capCss(5121)`.
2. If 5,120 is accepted and 5,121 is not, the ASCII cap is **C = 5,120**. Go to A2.
3. If both are accepted, gallop upward: 5,200, 6,144, 8,192, 10,240, 16,384, 20,480, 32,768, 65,536. Stop at the first one that is not accepted, then bisect (below) between the last accepted and the first refused size.
4. If 5,120 is refused, bisect between 5,000 and 5,120.

Bisection: keep `lo` (accepted) and `hi` (not accepted). Try `mid = Math.floor((lo + hi) / 2)`. If it is accepted, set `lo = mid`, otherwise `hi = mid`. Stop when `hi = lo + 1`; then **C = lo**. A 1,000-wide range needs about 10 saves.

**A2. Unit: characters, bytes or UTF-16 units?** Every size below is C code points; only the padding character changes.

| Step | Call | Code points | UTF-8 bytes | UTF-16 units | Accepted means |
|---|---|---|---|---|---|
| A2a | `capCss(C, 'é')` | C | about 2C | C | the cap does not count UTF-8 bytes |
| A2b | `capCss(C, '😀')` | C | about 4C | about 2C | the cap counts code points, not UTF-16 units |
| A2c | only if A2a was refused: pick n so that the printed `utf8Bytes` equals C, then try n + 1. For C = 5,120: `capCss(2603, 'é')` (5,120 bytes), then `capCss(2604, 'é')` (5,122 bytes) | about C/2 | C, then C + 2 | about C/2 | first accepted and second refused: a byte cap at C |

If A2a is accepted and A2b is refused, the cap counts UTF-16 units (a JavaScript-style `length`).

**A3. What counts.**

| Step | Call | Accepted means |
|---|---|---|
| A3a | `capCss(C, 'a', 'comment')`, then `capCss(C + 1, 'a', 'comment')` | the second refused: comments count like any other text |
| A3b | `capCss(C)`, then `copy(lastCap + '\n\n   ')` and save that | trailing whitespace is trimmed before counting |
| A3c | `capCss(C)`, then `copy('\n\n   ' + lastCap)` and save that | leading whitespace is trimmed before counting; `capRead()` on the stored text shows whether it was also removed from storage (the first characters of the block) |

**A4. Over-cap behaviour.** You already have it from A1: the verdict for C + 1, plus the exact lightbox text if any.

**A5. Restore** your backed-up CSS and confirm with `capRead()` (it reports "no cap test CSS stored") and a logged-out look at the profile.

## B. Project and devlog CSS cap (draft project)

Devlogs and the comments page have no editor of their own; they use the project's CSS. So one project test covers all of them.

1. **Gallop, single line.** `capCss(40000)`, `capCss(60000)`, `capCss(100000)`, `capCss(200000)`, `capCss(500000)`, `capCss(1000000)`. Stop at the first size that is not accepted. Note any HTTP error the lightbox reports (for example "Server error", which could be a request-size limit rather than a CSS cap).
2. **Bisect** between the last accepted and the first refused size to get C, as in A1.
3. **Unit** at C: A2a and A2b, as on the profile.
4. **Line breaks.** The project editor sends every line break as CRLF. `capCss(C, 'a', 'comment', 100)` has C code points including 100 LF characters; the server receives C + 100 characters. Accepted means the cap counts the text before CRLF conversion, or does not count the extra CR.
5. **Remove the test CSS.** One million characters of CSS is also page weight on every devlog and comments page of that project.

If nothing up to 1,000,000 characters is refused, record "no cap below 1,000,000" and stop.

## C. Jam CSS cap (only on a draft jam you host)

The jam editor appends your CSS after its own generated rules, and `capRead()` measures from `--cap-head`, so only your part is counted.

1. `capCss(20480)`, then `capCss(20481)`. Bisect if needed, as in A1.
2. Unit at C: A2a and A2b.
3. Note whether `cr` is 0: the jam editor is expected to store LF.

## D. Profile bio HTML cap (reported as 5,000 characters)

Run on the profile. Paste into Edit profile → bio, in `<>` HTML mode, and save. Read back with `capReadBio()`.

1. `capBio(5000)`, then `capBio(5001)`. Bisect if needed (as in A1) to find B, the largest accepted size.
2. **Sent or stored length?** `capBio(B - 10, 10)` has the same submitted length as an accepted bio, but its 10 off-site links each gain about 48 characters (`rel="nofollow noopener" referrerpolicy="origin"`) when itch serves it. Accepted means the cap measures the HTML you submitted; refused means it measures the expanded HTML (or something close to it). `injectedRel` should read 10.
3. Also note whether the bio editor counted characters as you typed (some editors show a counter).
4. **Restore** the bio from your backup.

## Recording

Use the cap table in `results-template.md`. For every attempt record: page type, n, fill, pad, line breaks, the generator's three measures, the verdict, the exact lightbox text, and `capRead()`'s stored measures. A result read back this way can be tagged `[verified <date> · live-cap-<step>]` in the knowledge base.
