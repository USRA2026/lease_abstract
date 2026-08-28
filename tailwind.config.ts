import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0b1220",
          900: "#101a2c",
          800: "#16223a",
        },
        accent: {
          DEFAULT: "#5b21b6",
          light: "#7c3aed",
        },
      },
    },
  },
  plugins: [],
};

export default config;
