// The owner's profile (mirokshi.itch.io), as the private repo's lib/title.js and lib/greeting.js have it.
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
  ],
};
