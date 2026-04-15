import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        plava: {
          DEFAULT: "#0AB3D7",
          light: "#E8F7FC",
          dark: "#088BAD",
        },
        koral: {
          DEFAULT: "#F78687",
          light: "#FFF3F3",
          dark: "#E06566",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
