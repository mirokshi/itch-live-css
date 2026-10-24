// Seeded randomness: the same seed always gives the same CSS, so outputs can be snapshot-tested
// and a per-visit service only has to pick a new seed.

// FNV-1a: turns any seed (string or number) into a 32-bit state.
function hash(seed) {
  let h = 0x811c9dc5;
  for (const c of String(seed)) h = Math.imul(h ^ c.codePointAt(0), 0x01000193);
  return h >>> 0;
}

// mulberry32: small, fast, good enough for visual variety (not for anything secret).
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rng(seed) {
  const next = mulberry32(hash(seed));
  const rand = (min, max) => min + next() * (max - min);
  return {
    next,
    rand,
    pick: (a) => a[Math.floor(next() * a.length)],
    // Fisher-Yates, in place.
    shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
