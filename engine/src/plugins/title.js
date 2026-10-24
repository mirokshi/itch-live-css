// Letter-mix title: each letter of h1.custom-title gets one font from a bag, never the same font
// twice in a row, and its weight "breathes" (wght 400↔700) through a shared rotating --breath
// angle with a random phase per letter. Needs variable fonts and one <span> per letter in the
// bio's <h1 class="custom-title">.
//
// options:
//   fonts  { key: 'declarations' }  e.g. { s: 'font-family:"Syne",sans-serif;font-style:normal' }
//   bag    [key, ...]               one entry per letter, in the wanted proportion

// h1.custom-title (one element more than a pasted .custom-title rule) so it wins even if the
// pasted CSS animates the title: imported rules lose specificity ties (knowledge base §6).
export function title({ fonts, bag }, { rand, shuffle }) {
  const counts = {};
  for (const k of bag) {
    if (!(k in fonts)) throw new Error(`title: bag uses "${k}", which is not in fonts`);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  // No arrangement without two equal neighbours exists when one font fills more than half.
  if (Math.max(...Object.values(counts)) > Math.ceil(bag.length / 2)) {
    throw new Error('title: one font fills more than half the bag, so two letters in a row would match');
  }
  // one full cycle (400 → 700 → 400) every 4–7 s; drawn before the mix, as the prototype does
  const period = n(rand(4, 7));
  let mix;
  do mix = shuffle([...bag]); while (mix.some((f, i) => f === mix[i - 1]));

  return [
    '@property --breath{syntax:"<angle>";inherits:true;initial-value:0deg}',
    '@keyframes custom-breath{to{--breath:360deg}}',
    `#wrapper h1.custom-title{animation:custom-breath ${period}s linear infinite}`,
    ...mix.map(
      (f, i) =>
        `#wrapper .custom-title span:nth-child(${i + 1}){${fonts[f]};` +
        `font-weight:calc(550 + 150*sin(var(--breath) + ${Math.round(rand(0, 360))}deg))}`,
    ),
  ];
}

// Short CSS number: at most 2 decimals, no trailing zeros.
const n = (x) => +x.toFixed(2);
