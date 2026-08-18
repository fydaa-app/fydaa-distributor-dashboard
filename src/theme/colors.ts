export type BrandKey = "amber" | "green" | "blue" | "red" | "purple" | "teal";

export const COLORS = {
  white: "#ffffff",

  bg: "#ffffff",
  bg2: "#f6f5f2",
  bg3: "#eeede9",

  txt: "#1a1a18",
  txt2: "#6b6b67",
  txt3: "#a8a8a3",
  txtAlt: "#8a8a85",

  bdr: "rgba(0, 0, 0, 0.10)",
  bdr2: "rgba(0, 0, 0, 0.20)",

  darkBg: "#1c1c1a",
  darkBg2: "#252522",
  darkBg3: "#2d2d2a",

  darkTxt: "#f0efe8",
  darkTxt2: "#9a9a93",
  darkTxt3: "#68685f",

  darkBdr: "rgba(255, 255, 255, 0.10)",
  darkBdr2: "rgba(255, 255, 255, 0.22)",

  brand: {
  amber: {
    DEFAULT: "#3B7D3A",
    bg: "#EAF4E8",
    txt: "#2F6630",
    hover: "#326D31",
    shadow: "rgba(59, 125, 58, 0.24)",
    darkBg: "#163617",
    darkTxt: "#A8D5A5",
  },
    green: {
      DEFAULT: "#3B6D11",
      bg: "#EAF3DE",
      txt: "#1a1a18",
      hover: "#2d570d",
      shadow: "rgba(59, 109, 17, 0.24)",
      darkBg: "#173404",
      darkTxt: "#9fe1cb",
    },
    blue: {
      DEFAULT: "#185FA5",
      bg: "#E6F1FB",
      txt: "#1a1a18",
      hover: "#14487d",
      shadow: "rgba(24, 95, 165, 0.24)",
      darkBg: "#042c53",
      darkTxt: "#B5D4F4",
    },
    red: {
      DEFAULT: "#A32D2D",
      bg: "#FCEBEB",
      txt: "#1a1a18",
      hover: "#7f2424",
      shadow: "rgba(163, 45, 45, 0.24)",
      darkBg: "#501313",
      darkTxt: "#F09595",
    },
    purple: {
      DEFAULT: "#534AB7",
      bg: "#EEEDFE",
      txt: "#1a1a18",
      hover: "#423d92",
      shadow: "rgba(83, 74, 183, 0.24)",
      darkBg: "#26215c",
      darkTxt: "#CECBF6",
    },
    teal: {
      DEFAULT: "#0F6E56",
      bg: "#E1F5EE",
      txt: "#1a1a18",
      hover: "#0c5643",
      shadow: "rgba(15, 110, 86, 0.24)",
      darkBg: "#04342c",
      darkTxt: "#9fe1cb",
    },
  } as const,

  green: "#3B6D11",
  greenBg: "#EAF3DE",
  greenDarkTxt: "#C0DD97",

  blue: "#185FA5",
  blueBg: "#E6F1FB",
  blueDarkTxt: "#B5D4F4",

  red: "#A32D2D",
  redBg: "#FCEBEB",
  redDarkTxt: "#F09595",

  purple: "#534AB7",
  purpleBg: "#EEEDFE",
  purpleDarkTxt: "#CECBF6",

  teal: "#0F6E56",
  tealBg: "#E1F5EE",
  tealDarkTxt: "#9fe1cb",

  chartBorder: "rgba(0, 0, 0, 0.08)",
  darkChartBorder: "rgba(255, 255, 255, 0.08)",
  checkboxBorder: "#E4E7EC",

  brandShadow4: "rgba(186, 117, 23, 0.04)",
  brandShadow6: "rgba(186, 117, 23, 0.06)",
  brandShadow8: "rgba(186, 117, 23, 0.08)",
  brandShadow12: "rgba(186, 117, 23, 0.12)",
  brandShadow15: "rgba(186, 117, 23, 0.15)",
  brandShadow18: "rgba(186, 117, 23, 0.18)",
  brandShadow20: "rgba(186, 117, 23, 0.20)",
  brandShadow30: "rgba(186, 117, 23, 0.30)",
  brandShadow40: "rgba(186, 117, 23, 0.40)",

  neutralShadow4: "rgba(0, 0, 0, 0.04)",
  neutralShadow6: "rgba(0, 0, 0, 0.06)",

  authBlue: "rgba(24, 95, 165, 0.18)",
  glassLight: "rgba(255, 255, 255, 0.54)",
  glassDark: "rgba(28, 28, 26, 0.58)",
} as const;

export type ColorKey = keyof typeof COLORS;
