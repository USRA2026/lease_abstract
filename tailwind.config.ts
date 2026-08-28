import type { Config } from "tailwindcss";

// U.S. Realty Advisors brand palette. These six colors (plus neutral
// white/black) are the entire palette — see usra-brand-standards skill.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        usra: {
          primary: "#0C5AA9", // Primary blue — lead accent, wordmark, links, key CTAs
          navy: "#14426F", // Dark navy — headers, structural elements (the workhorse)
          deep: "#091E30", // Deep navy — darkest tone, cover banners, body text
          sky: "#45B3DA", // Light blue — highlights, callouts, data accents
          pale: "#BFDCF3", // Pale blue — soft fills, banding
          gray: "#707070", // Muted text, captions, footnotes
        },
      },
      fontFamily: {
        sans: ["Calibri", "Carlito", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
