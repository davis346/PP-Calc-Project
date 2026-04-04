export const lightColors = {
  pri: "#1E3A5F",
  priDk: "#0F1F38",
  priLt: "#2D5F8A",
  acc: "#D4A843",
  accLt: "#F0DCA0",
  sky: "#EAF1F8",
  skyDp: "#C4D9ED",
  bg: "#F5F7FA",
  white: "#FFFFFF",
  text: "#1A2340",
  sub: "#6B7A94",
  bdr: "#DDE1E9",
  danger: "#D63031",
  success: "#27AE60",
  card: "#FFFFFF",
  bkm: "#E67E22",
};

export const darkColors = {
  pri: "#4A90D9",
  priDk: "#0F1F38",
  priLt: "#5AA0E8",
  acc: "#D4A843",
  accLt: "#F0DCA0",
  sky: "#1A2535",
  skyDp: "#222F45",
  bg: "#0F1923",
  white: "#1E2D42",
  text: "#E8EDF5",
  sub: "#8A9BB5",
  bdr: "#2A3A52",
  danger: "#E05555",
  success: "#2ECC71",
  card: "#1A2535",
  bkm: "#E67E22",
};

// Static export kept for files not yet migrated to useColors()
export const C = lightColors;

export type ColorPalette = typeof lightColors;
