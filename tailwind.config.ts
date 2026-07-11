import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        arn: {
          bg: "#ffffff",
          bg2: "#f6f5f2",
          bg3: "#eeede9",
          txt: "#1a1a18",
          txt2: "#6b6b67",
          txt3: "#a8a8a3",
          bdr: "rgba(0, 0, 0, 0.10)",
          bdr2: "rgba(0, 0, 0, 0.20)",
          amber: "#BA7517",
          amberBg: "#FAEEDA",
          amberTxt: "#854F0B",
          green: "#3B6D11",
          greenBg: "#EAF3DE",
          blue: "#185FA5",
          blueBg: "#E6F1FB",
          red: "#A32D2D",
          redBg: "#FCEBEB",
          purBg: "#EEEDFE",
          purTxt: "#534AB7",
          telBg: "#E1F5EE",
          telTxt: "#0F6E56",
        },
      },
    },
  },
  plugins: [],
};

export default config;
