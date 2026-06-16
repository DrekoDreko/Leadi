/** Utilidades de cor (hex) para gradientes e contrastes dos templates. */

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16)
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** amount > 0 clareia, amount < 0 escurece (faixa -1..1). */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const target = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return toHex({
    r: r + (target - r) * p,
    g: g + (target - g) * p,
    b: b + (target - b) * p
  });
}

/** Luminancia relativa simples para decidir texto claro/escuro sobre a cor. */
export function readableText(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#10243F" : "#FFFFFF";
}
