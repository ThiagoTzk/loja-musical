import React, { createContext, ReactNode, useState } from "react";

type ThemeType = "light" | "dark";

type ThemeColors = {
  background: string;
  backgroundSoft: string;
  card: string;
  cardStrong: string;
  text: string;
  secondaryText: string;
  mutedText: string;
  accent: string;
  accentStrong: string;
  accentText: string;
  border: string;
  borderStrong: string;
  inputBackground: string;
  danger: string;
  dangerBackground: string;
  success: string;
  successBackground: string;
  shadow: string;
  focus: string;
  overlay: string;
  chip: string;
};

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: ThemeColors;
}

export const ThemeContext = createContext<ThemeContextProps>(
  {} as ThemeContextProps
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>("dark");

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const darkColors: ThemeColors = {
    background: "#0B0F14",
    backgroundSoft: "#111827",
    card: "#17202B",
    cardStrong: "#202B38",
    text: "#F8FAFC",
    secondaryText: "#CBD5E1",
    mutedText: "#94A3B8",
    accent: "#FFD166",
    accentStrong: "#F4A261",
    accentText: "#1A1202",
    border: "#6B7F99",
    borderStrong: "#F8D47A",
    inputBackground: "#101923",
    danger: "#FF8A8A",
    dangerBackground: "#3A1215",
    success: "#7EE2A8",
    successBackground: "#0F2E20",
    shadow: "#000000",
    focus: "#7DD3FC",
    overlay: "#000000AA",
    chip: "#263446",
  };

  const lightColors: ThemeColors = {
    background: "#FFF8ED",
    backgroundSoft: "#F7EBD8",
    card: "#FFFFFF",
    cardStrong: "#F2E1C6",
    text: "#14110F",
    secondaryText: "#4A4036",
    mutedText: "#6B5A4C",
    accent: "#9B4D00",
    accentStrong: "#6B2F00",
    accentText: "#FFFFFF",
    border: "#A67C52",
    borderStrong: "#6B2F00",
    inputBackground: "#FFFDF8",
    danger: "#9F1239",
    dangerBackground: "#FFE4E6",
    success: "#166534",
    successBackground: "#DCFCE7",
    shadow: "#7A4B16",
    focus: "#0E7490",
    overlay: "#00000099",
    chip: "#F4DFBF",
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
