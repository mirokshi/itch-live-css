// Helpers for writing CSS text.

// Short CSS number: at most 2 decimals, no trailing zeros (3.14159 → 3.14, 2.50 → 2.5).
export const n = (x) => +x.toFixed(2);

// Text → quoted CSS string. Non-ASCII goes out as \hex escapes, so the result doesn't depend on
// the encoding the browser reads the CSS with; line breaks become \a (they can't appear raw in a
// CSS string). The space after each escape closes it (CSS eats it), so a real space after it stays.
export function cssString(s) {
  const body = [...s]
    .map((c) => {
      const code = c.codePointAt(0);
      if (code > 126 || code < 32) return `\\${code.toString(16)} `;
      return c === '"' || c === '\\' ? `\\${c}` : c;
    })
    .join('');
  return `"${body}"`;
}

// Hand-written CSS → one line: drops comments and the whitespace CSS doesn't need, by the same rules
// as the owner's old regex minifier (no space next to { } ; , or after :, no ; before }), but strings,
// unquoted url(...) and \ escapes are copied untouched. The space before : stays (" ::selection").
export function minify(css) {
  let out = '';
  let space = false; // whitespace skipped since the last character written
  for (let i = 0; i < css.length; ) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? css.length : end + 2;
      continue;
    }
    if (/\s/.test(c)) {
      space = true;
      i++;
      continue;
    }
    let token = c;
    if (c === '\\') token = css.slice(i, i + 2);
    else if (c === '"' || c === "'") {
      let k = i + 1;
      while (k < css.length && css[k] !== c && css[k] !== '\n') k += css[k] === '\\' ? 2 : 1;
      token = css.slice(i, k + 1);
    } else if ((c === 'u' || c === 'U') && /^url\(\s*[^\s'"]/i.test(css.slice(i, i + 64))) {
      const end = css.indexOf(')', i);
      token = css.slice(i, end < 0 ? css.length : end + 1);
    }
    if (space && out && !/[{};,:]$/.test(out) && !'{};,'.includes(c)) out += ' ';
    if (c === '}' && out.endsWith(';')) out = out.slice(0, -1);
    out += token;
    i += token.length;
    space = false;
  }
  return out;
}
