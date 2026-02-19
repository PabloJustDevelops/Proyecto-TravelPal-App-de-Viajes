"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    // No eliminamos 'light' porque en la estrategia de clase, solo 'dark' activa el modo oscuro.
    // La ausencia de 'dark' es el modo claro por defecto.
    
    let targetTheme = theme;
    if (theme === "system") {
      targetTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    if (targetTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    setResolvedTheme(targetTheme as "light" | "dark");

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Listen for system changes if theme is system
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const newTheme = mediaQuery.matches ? "dark" : "light";
      const root = window.document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      setResolvedTheme(newTheme);
    };
    
    // Set initial resolved theme for system
    setResolvedTheme(mediaQuery.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
