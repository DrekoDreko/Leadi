// Paleta de cores tema-safe para colunas do funil e etiquetas.
// Cada chave mapeia para classes Tailwind que adaptam a tema claro/escuro.
// As strings sao literais para o JIT do Tailwind gera-las.

export const BOARD_COLOR_KEYS = [
  "cobalt",
  "lagoon",
  "signal",
  "emerald",
  "amber",
  "red",
  "violet",
  "rose",
  "ink",
  "slate"
] as const;

export type BoardColorKey = (typeof BOARD_COLOR_KEYS)[number];

export type BoardColorClasses = {
  /** Ponto/traço colorido (bolinha, barra do topo da coluna). */
  dot: string;
  /** Fundo suave translúcido (cabeçalho da coluna, capa clara). */
  soft: string;
  /** Fundo sólido com texto contrastante (pílula de etiqueta preenchida). */
  solid: string;
  /** Texto na cor. */
  text: string;
  /** Anel de foco/realce. */
  ring: string;
};

const COLOR_MAP: Record<BoardColorKey, BoardColorClasses> = {
  cobalt: {
    dot: "bg-cobalt",
    soft: "bg-cobalt/12",
    solid: "bg-cobalt text-white",
    text: "text-cobalt",
    ring: "ring-cobalt/40"
  },
  lagoon: {
    dot: "bg-lagoon",
    soft: "bg-lagoon/12",
    solid: "bg-lagoon text-white",
    text: "text-lagoon",
    ring: "ring-lagoon/40"
  },
  signal: {
    dot: "bg-signal",
    soft: "bg-signal/16",
    solid: "bg-signal text-accent-foreground",
    text: "text-signal",
    ring: "ring-signal/40"
  },
  emerald: {
    dot: "bg-emerald-500",
    soft: "bg-emerald-500/12",
    solid: "bg-emerald-600 text-white",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/40"
  },
  amber: {
    dot: "bg-amber-500",
    soft: "bg-amber-500/14",
    solid: "bg-amber-500 text-white",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/40"
  },
  red: {
    dot: "bg-red-500",
    soft: "bg-red-500/12",
    solid: "bg-red-600 text-white",
    text: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/40"
  },
  violet: {
    dot: "bg-violet-500",
    soft: "bg-violet-500/12",
    solid: "bg-violet-600 text-white",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/40"
  },
  rose: {
    dot: "bg-rose-500",
    soft: "bg-rose-500/12",
    solid: "bg-rose-600 text-white",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/40"
  },
  ink: {
    dot: "bg-ink",
    soft: "bg-surface-elevated",
    solid: "bg-ink text-cloud",
    text: "text-foreground",
    ring: "ring-border"
  },
  slate: {
    dot: "bg-muted-foreground/60",
    soft: "bg-muted",
    solid: "bg-surface-elevated text-foreground",
    text: "text-muted-foreground",
    ring: "ring-border"
  }
};

export const DEFAULT_BOARD_COLOR: BoardColorKey = "slate";

export function isBoardColorKey(value: string): value is BoardColorKey {
  return (BOARD_COLOR_KEYS as readonly string[]).includes(value);
}

export function getBoardColorClasses(color: string | null | undefined): BoardColorClasses {
  if (color && isBoardColorKey(color)) {
    return COLOR_MAP[color];
  }
  return COLOR_MAP[DEFAULT_BOARD_COLOR];
}
