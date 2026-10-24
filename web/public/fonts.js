// Fonts the title can mix. Only these keys are accepted, so no CSS from the user reaches the
// output. All are variable fonts with a wght axis covering 400–700 (the title "breathes" between
// them). Shared by the page (font checkboxes) and the server (CSS + Google Fonts @import).
export const FONTS = {
  syne: {
    name: 'Syne',
    css: 'font-family:"Syne",sans-serif;font-style:normal',
    google: 'Syne:wght@400..800',
  },
  hand: {
    name: 'Edu AU VIC WA NT Hand',
    css: 'font-family:"Edu AU VIC WA NT Hand",cursive;font-style:normal;font-size:.85em',
    google: 'Edu+AU+VIC+WA+NT+Hand:wght@400..700',
  },
  playfair: {
    name: 'Playfair Display (cursiva)',
    css: 'font-family:"Playfair Display",serif;font-style:italic',
    google: 'Playfair+Display:ital,wght@1,400..900',
  },
  inter: {
    name: 'Inter',
    css: 'font-family:"Inter",sans-serif;font-style:normal',
    google: 'Inter:wght@100..900',
  },
  fraunces: {
    name: 'Fraunces',
    css: 'font-family:"Fraunces",serif;font-style:normal',
    google: 'Fraunces:wght@100..900',
  },
  grotesk: {
    name: 'Space Grotesk',
    css: 'font-family:"Space Grotesk",sans-serif;font-style:normal',
    google: 'Space+Grotesk:wght@300..700',
  },
  mono: {
    name: 'JetBrains Mono',
    css: 'font-family:"JetBrains Mono",monospace;font-style:normal',
    google: 'JetBrains+Mono:wght@100..800',
  },
};
