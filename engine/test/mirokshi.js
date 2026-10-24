// The owner's profile (mirokshi.itch.io), as the private repo's lib/title.js, greeting.js, cards.js and ascii.js have it.
export const config = {
  plugins: [
    {
      use: 'title',
      options: {
        fonts: {
          s: 'font-family:"Syne",sans-serif;font-style:normal;font-size:1em',
          h: 'font-family:"Edu AU VIC WA NT Hand",cursive;font-style:normal;font-size:.85em',
          p: 'font-family:"Playfair Display",serif;font-style:italic;font-size:1em',
        },
        // 3 Syne, 2 Edu Hand, 3 Playfair: one per letter of "Mirokshi"
        bag: ['s', 's', 's', 'h', 'h', 'p', 'p', 'p'],
      },
    },
    {
      use: 'greeting',
      options: {
        first: '¡Hola!',
        // the 10 most spoken languages minus English (the bio sentence and the marker already are)
        others: [
          '你好',
          'नमस्ते',
          'مرحبا',
          'Bonjour' + String.fromCharCode(0x202f) + '!', // narrow no-break space before "!"
          'Olá!',
          'Привет!',
          'こんにちは',
          'Hallo!',
          '안녕하세요',
        ],
        color: 'var(--gold)', // defined in the owner's pasted CSS
      },
    },
    { use: 'cards' },
    { use: 'ascii' },
  ],
};

// For cards: the private repo's dev.js --mock data (real ids of the owner's games, made-up figures),
// at a pinned date so "New" doesn't change with the calendar.
export const now = Date.parse('2026-10-24T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
export const games = [
  { id: 2660825, views: 1840, downloads: 0, published: Date.parse('2024-03-02T10:00:00Z') }, // where-i-am
  { id: 1862929, views: 920, downloads: 312, published: Date.parse('2023-01-15T10:00:00Z') }, // call-of-the-ranger
  { id: 2540459, views: 45, downloads: 3, published: now - 20 * DAY }, // testapi
];
