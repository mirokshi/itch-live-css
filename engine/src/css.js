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
