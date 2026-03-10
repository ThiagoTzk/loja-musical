import React, { createContext, ReactNode, useState } from "react";

type ThemeType = "light" | "dark";

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    secondaryText: string;
    accent: string;
  };
}

export const ThemeContext = createContext<ThemeContextProps>(
  {} as ThemeContextProps
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>("dark");

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const darkColors = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#FFFFFF",
    secondaryText: "#B3B3B3",
    accent: "#FFD700",
  };

  const lightColors = {
    background: "#FFFFFF",
    card: "#F2F2F2",
    text: "#000000",
    secondaryText: "#555555",
    accent: "#FFC107",
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}