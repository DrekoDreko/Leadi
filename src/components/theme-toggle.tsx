"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder of the exact same size
    return (
      <div className="icon-button" aria-hidden="true" />
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
      className="icon-button relative flex items-center justify-center"
      title={currentTheme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      type="button"
      aria-label="Alternar tema"
    >
      {currentTheme === "light" ? (
        <Moon size={18} className="transition-all" aria-hidden="true" />
      ) : (
        <Sun size={18} className="transition-all" aria-hidden="true" />
      )}
    </button>
  );
}
