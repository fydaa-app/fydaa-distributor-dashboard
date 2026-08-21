export const COLORS = {
  white: "#ffffff",

  bg: "#ffffff",
  bg2: "#f6f5f2",
  bg3: "#eeede9",

  txt: "#1a1a18",
  txt2: "#6b6b67",
  txt3: "#a8a8a3",

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
      DEFAULT: "#BA7517",
      bg: "#FAEEDA",
      txt: "#854F0B",
      hover: "#A46512",
      shadow: "rgba(186, 117, 23, 0.24)",
      darkBg: "#412402",
      darkTxt: "#FAC775",
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

  currentBrand: "amber" as const,

  inputRing: "rgba(186, 117, 23, 0.1)",
  loginShadow: "rgba(186, 117, 23, 0.20)",
  loginShadowHover: "rgba(186, 117, 23, 0.26)",
  loginGlassLight: "rgba(255, 255, 255, 0.54)",
  loginGlassDark: "rgba(28, 28, 26, 0.58)",
  brandGradAmber: "rgba(186, 117, 23, 0.22)",
  brandGradBlue: "rgba(24, 95, 165, 0.18)",
  dropShadow: "rgba(0, 0, 0, 0.18)",
  dropShadowDark: "rgba(0, 0, 0, 0.35)",
  successRing: "rgba(59, 109, 17, 0.4)",
  brandBg: "#2d2d2a",
} as const;

export type ColorKey = keyof typeof COLORS;
export type BrandKey = keyof typeof COLORS.brand;
