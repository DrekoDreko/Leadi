"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const handleToggle = () => {
    const next = theme === "light" ? "dark" : "light";

    // Navegadores sem View Transitions API ou usuários que preferem menos
    // movimento: troca instantânea (comportamento original, sem quebra).
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!document.startViewTransition || prefersReducedMotion) {
      setTheme(next);
      return;
    }

    // Crossfade suave de toda a tela entre claro e escuro. flushSync garante
    // que o next-themes aplique a classe no <html> dentro do callback, para o
    // snapshot "depois" sair com o tema já trocado.
    document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });
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
