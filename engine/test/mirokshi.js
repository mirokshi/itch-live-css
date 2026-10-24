// The owner's profile title (mirokshi.itch.io), as the private repo's lib/title.js has it.
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
  ],
};
