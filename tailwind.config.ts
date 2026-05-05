import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cafe: {
          bg:     '#F5EDD8',
          bar:    '#8B6343',
          card:   '#FAF6EE',
          border: '#E8D5B7',
          panel:  '#EDE0C8',
          text:   '#3D2B1F',
        },
      },
    },
  },
  plugins: [],
};
export default config;
