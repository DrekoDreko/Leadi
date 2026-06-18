# CLAUDE.md

Guia para agentes e devs trabalhando neste app (Leadi — CRM + Meta Ads).

## Padrão visual / Tema (OBRIGATÓRIO)

O app suporta **tema claro e escuro** via `next-themes` (`attribute="class"`, classe `.dark` no `<html>`). A página de referência do padrão é **`/dashboard/criacoes`** ([app/dashboard/criacoes/page.tsx](app/dashboard/criacoes/page.tsx)).

**Regra de ouro:** nunca use cores fixas que não se adaptam ao tema. Use sempre **tokens semânticos** definidos em [app/globals.css](app/globals.css) e [tailwind.config.ts](tailwind.config.ts) — eles já têm versão clara e escura.

### ❌ Proibido (não adapta ao dark mode)

- `bg-white` em qualquer opacidade média/alta (`bg-white/40` … `bg-white/100`) como superfície, pílula ou botão
- Paleta crua do Tailwind: `*-gray-*`, `*-slate-*`, `*-zinc-*`, `*-neutral-*`, `*-stone-*` (texto, fundo, borda, ring, gradiente)
- `bg-white` sólido
- Hex fixo de cinza/branco em `className`

### ✅ Use os tokens semânticos

| Papel | Token a usar |
|---|---|
| Cartão / superfície principal | `surface-card` (classe utilitária) ou `bg-card` |
| Cartão suave / secundário | `surface-card-muted`, `bg-dashboard-card-muted` |
| Cartão elevado / hover | `bg-surface-elevated`, `surface-card-strong` |
| Painel / modal | `surface-panel`, `surface-modal` |
| Pílula / badge neutro | `surface-pill`, `surface-pill-strong` |
| Botão secundário | `surface-action-secondary` |
| Alertas | `surface-alert-warning`, `surface-alert-success`, `surface-danger` |
| Texto principal | `text-foreground` (ou `text-ink` — `--color-ink` adapta) |
| Texto secundário | `text-muted-foreground`, `text-muted-soft`, `text-muted-strong` |
| Borda | `border-border` |
| Destaque/links | `text-cobalt`, cor `cobalt` / `bg-primary` / `bg-signal` |
| Status semântico | `success`, `warning`, `destructive`, `info` (ex: `bg-success/14 text-foreground`) |

### Mapeamento de migração (de → para)

| Antigo (quebra no dark) | Novo (adapta) |
|---|---|
| `bg-white` / `bg-white/80` (card) | `surface-card` |
| `bg-white/55..72 text-ink` (pílula) | `surface-pill text-foreground` ou `surface-card-muted` |
| `bg-white/34..54` (superfície suave) | `surface-card-muted` ou `bg-muted` |
| `bg-white/40..72` (botão) | `surface-action-secondary` |
| `hover:bg-white/N` (sólido) | `hover:bg-surface-elevated` |
| `text-gray-400/500/600` | `text-muted-foreground` |
| `text-gray-700/800/900` | `text-foreground` |
| `bg-gray-50/100/200` | `bg-muted` / `surface-card-muted` |
| `border-gray-200/300` | `border-border` |
| `text-slate-*` | `text-muted-foreground` / `text-foreground` |

### O que NÃO é problema

- `text-ink`, `bg-ink/N`, `text-cloud` → `--color-ink`/`--color-cloud` já são redefinidos no `.dark`, então adaptam sozinhos.
- `text-white` / `bg-white/5..24` **sobre uma cor sólida** (botão cobalt, badge colorido, brilho/glow sutil de vidro) → ok, é highlight intencional que funciona nos dois temas.
- Tokens `cobalt`, `signal`, `lagoon`, `mist` → têm variante no `.dark`.

### Ao criar páginas novas

Comece copiando a estrutura de `criacoes`: `PageHeading` + seções com `surface-card`/`surface-card-muted`, textos com `text-muted-soft`, destaques com `text-cobalt`. Sempre valide a tela com o tema escuro ativo (toggle no header do dashboard).

## Idioma

Responder e escrever comentários/UI em **pt-BR**.
