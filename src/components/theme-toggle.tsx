"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const handleToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={handleToggle}
      className="icon-button relative z-10 flex touch-manipulation items-center justify-center"
      title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      type="button"
      aria-label="Alternar tema"
    >
      {theme === "light" ? (
        <Moon size={18} className="transition-all" aria-hidden="true" />
      ) : (
        <Sun size={18} className="transition-all" aria-hidden="true" />
      )}
    </button>
  );
}
