"use client";

// Gráficos de tendência desenhados à mão — leves, sem dependência externa e
// 100% adaptáveis ao tema (tokens --chart-* definidos em globals.css, com
// versão clara e escura validadas p/ contraste e daltonismo).
//
// Todos os gráficos são autoexplicativos: eixo de datas embaixo, valor do
// último ponto rotulado e tooltip ao passar o mouse (ou navegar com as setas
// do teclado). Uma tabela invisível (sr-only) espelha os dados p/ leitores de
// tela.

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const VIEW_W = 100;
const VIEW_H = 36;
const PAD_Y = 3;
const USABLE_H = VIEW_H - PAD_Y * 2;

export type Tone = "blue" | "teal" | "green";
export type ValueKind = "currency" | "integer";

export type ChartPoint = { date: string; value: number };

const TONE_TEXT: Record<Tone, string> = {
  blue: "text-chart-blue",
  teal: "text-chart-teal",
  green: "text-chart-green"
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const int = new Intl.NumberFormat("pt-BR");
const intCompact = new Intl.NumberFormat("pt-BR", { notation: "compact" });

function formatValue(value: number, kind: ValueKind, compact = false): string {
  if (kind === "currency") return brl.format(value);
  return compact && value >= 10_000 ? intCompact.format(value) : int.format(value);
}

// "2026-06-12" → "12/06" (rótulo curto de eixo/tooltip)
function formatDay(date: string): string {
  const [, month, day] = date.split("-");
  return month && day ? `${day}/${month}` : date;
}

function allZero(points: ChartPoint[]): boolean {
  return points.every((point) => point.value === 0);
}

function toXPercent(index: number, total: number): number {
  return total === 1 ? 50 : (index / (total - 1)) * 100;
}

// Normaliza valores no viewBox usando um domínio explícito (permite escala
// compartilhada entre séries). Trata 1 ponto e série constante sem quebrar.
function toSvgPoints(
  values: number[],
  min: number,
  max: number
): { x: number; y: number }[] {
  const span = max - min;
  return values.map((value, index) => {
    const x = values.length === 1 ? VIEW_W / 2 : (index / (values.length - 1)) * VIEW_W;
    const ratio = span === 0 ? 0.5 : (value - min) / span;
    const y = VIEW_H - PAD_Y - ratio * USABLE_H;
    return { x, y };
  });
}

function linePath(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function yPercent(value: number, min: number, max: number): number {
  const span = max - min;
  const ratio = span === 0 ? 0.5 : (value - min) / span;
  return ((PAD_Y + (1 - ratio) * USABLE_H) / VIEW_H) * 100;
}

// ---------------------------------------------------------------------------
// Blocos compartilhados

// Eixo X: linha-base sólida + primeira e última data do período.
function DateAxis({ points }: { points: ChartPoint[] }) {
  const first = points[0]?.date;
  const last = points[points.length - 1]?.date;
  return (
    <div className="mt-2 flex items-center justify-between border-t border-border pt-1.5 text-[11px] font-medium text-muted-foreground">
      <span>{first ? formatDay(first) : ""}</span>
      {points.length > 2 ? <span className="opacity-70">por dia</span> : null}
      <span>{last && last !== first ? formatDay(last) : ""}</span>
    </div>
  );
}

// Tooltip único: data em cima, uma linha por série (valor forte, nome discreto).
function Tooltip({
  date,
  rows,
  xPercent
}: {
  date: string;
  rows: { label: string; value: string; tone: Tone }[];
  xPercent: number;
}) {
  const clamped = Math.min(Math.max(xPercent, 12), 88);
  return (
    <div
      className="pointer-events-none absolute bottom-full z-10 mb-1.5 -translate-x-1/2"
      style={{ left: `${clamped}%` }}
    >
      <div className="whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 shadow-soft">
        <p className="text-[11px] font-medium text-muted-foreground">{formatDay(date)}</p>
        {rows.map((row) => (
          <p key={row.label} className="mt-0.5 flex items-center gap-1.5 text-sm">
            <span
              className={`inline-block h-[3px] w-3.5 rounded-full bg-current ${TONE_TEXT[row.tone]}`}
              aria-hidden="true"
            />
            <strong className="font-semibold text-foreground">{row.value}</strong>
            <span className="text-xs text-muted-foreground">{row.label}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// Tabela invisível: garante que todo valor do gráfico é alcançável sem hover.
function SrTable({
  caption,
  points,
  kind
}: {
  caption: string;
  points: ChartPoint[];
  kind: ValueKind;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">{caption}</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.date}>
            <td>{formatDay(point.date)}</td>
            <td>{formatValue(point.value, kind)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-2xl border border-border bg-surface-elevated/60 px-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

// Hook de interação: pointer → índice mais próximo; setas ← → no teclado.
function useHoverIndex(total: number) {
  const [index, setIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || total === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    setIndex(Math.min(total - 1, Math.max(0, Math.round(ratio * (total - 1)))));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setIndex((current) => Math.min(total - 1, (current ?? -1) + 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setIndex((current) => Math.max(0, (current ?? total) - 1));
    } else if (event.key === "Escape") {
      setIndex(null);
    }
  };

  return {
    ref,
    index,
    clear: () => setIndex(null),
    handlers: {
      onPointerMove,
      onPointerLeave: () => setIndex(null),
      onKeyDown,
      onBlur: () => setIndex(null)
    }
  };
}

// ---------------------------------------------------------------------------
// Linha + área: usada para o gasto (evolução diária).

export function TrendArea({
  points,
  tone = "blue",
  label,
  kind,
  emptyMessage
}: {
  points: ChartPoint[];
  tone?: Tone;
  label: string;
  kind: ValueKind;
  emptyMessage: string;
}) {
  const gradientId = useId();
  const hover = useHoverIndex(points.length);

  if (points.length === 0 || allZero(points)) {
    return <EmptyChart message={emptyMessage} />;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const svgPoints = toSvgPoints(values, min, max);
  const last = points[points.length - 1];
  const lastX = toXPercent(points.length - 1, points.length);
  const lastY = yPercent(last.value, min, max);
  const active = hover.index !== null ? points[hover.index] : null;
  const activeX = hover.index !== null ? toXPercent(hover.index, points.length) : 0;

  return (
    <div>
      <div
        ref={hover.ref}
        {...hover.handlers}
        tabIndex={0}
        role="img"
        aria-label={`${label} por dia — use as setas para percorrer os valores`}
        className="relative h-28 w-full cursor-crosshair rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cobalt/50"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className={`absolute inset-0 h-full w-full ${TONE_TEXT[tone]}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d={`${linePath(svgPoints)} L${VIEW_W} ${VIEW_H} L0 ${VIEW_H} Z`}
            fill={`url(#${gradientId})`}
          />
          <path
            d={linePath(svgPoints)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Crosshair no dia mais próximo do ponteiro */}
        {active ? (
          <span
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-border"
            style={{ left: `${activeX}%` }}
            aria-hidden="true"
          />
        ) : null}

        {/* Marcador + rótulo do último dia (o valor "de hoje") */}
        <span
          className={`pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-card ${TONE_TEXT[tone]}`}
          style={{ left: `${lastX}%`, top: `${lastY}%` }}
          aria-hidden="true"
        />
        {!active ? (
          <span
            className="pointer-events-none absolute whitespace-nowrap rounded-md bg-card/80 px-1.5 py-0.5 text-xs font-semibold text-foreground"
            style={
              // Rótulo colado no marcador final: acima e à esquerda quando o
              // ponto está na borda direita; centralizado sobre ele nos demais.
              lastX > 70
                ? {
                    right: `calc(${100 - lastX}% + 8px)`,
                    top: `calc(${lastY}% - 8px)`,
                    transform: "translateY(-100%)"
                  }
                : {
                    left: `${lastX}%`,
                    top: `calc(${lastY}% - 8px)`,
                    transform: "translate(-50%, -100%)"
                  }
            }
            aria-hidden="true"
          >
            {formatValue(last.value, kind, true)}
          </span>
        ) : null}

        {active ? (
          <Tooltip
            date={active.date}
            rows={[{ label, value: formatValue(active.value, kind), tone }]}
            xPercent={activeX}
          />
        ) : null}
      </div>
      <DateAxis points={points} />
      <SrTable caption={label} points={points} kind={kind} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barras: usadas para leads e cliques (contagens diárias).

export function TrendBars({
  points,
  tone = "blue",
  label,
  kind = "integer",
  emptyMessage
}: {
  points: ChartPoint[];
  tone?: Tone;
  label: string;
  kind?: ValueKind;
  emptyMessage: string;
}) {
  const hover = useHoverIndex(points.length);
  const max = points.length > 0 ? Math.max(...points.map((point) => point.value)) : 0;

  if (points.length === 0 || max === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  const active = hover.index !== null ? points[hover.index] : null;
  const activeX =
    hover.index !== null ? ((hover.index + 0.5) / points.length) * 100 : 0;
  const lastValue = points[points.length - 1].value;
  // Barras crescem até 84% da área p/ deixar espaço ao rótulo acima do topo.
  const barPct = (value: number) =>
    value > 0 ? Math.max((value / max) * 84, 6) : 2;

  return (
    <div>
      <div
        tabIndex={0}
        role="img"
        aria-label={`${label} por dia — use as setas para percorrer os valores`}
        onKeyDown={hover.handlers.onKeyDown}
        onBlur={hover.handlers.onBlur}
        className={`flex h-28 justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cobalt/50 ${TONE_TEXT[tone]}`}
      >
        {/* Faixa central: rótulo, tooltip e hover são calculados em % DELA,
            então ficam sempre alinhados às barras (que têm largura limitada). */}
        <div
          ref={hover.ref}
          onPointerMove={hover.handlers.onPointerMove}
          onPointerLeave={hover.handlers.onPointerLeave}
          className="relative flex h-full items-end gap-0.5"
          style={{ width: `min(100%, ${points.length * 36}px)` }}
        >
          {points.map((point, index) => {
            const pct = barPct(point.value);
            const isLast = index === points.length - 1;
            const isActive = hover.index === index;
            return (
              // Área de acerto ocupa a altura toda; a barra fica no rodapé.
              <div key={point.date} className="flex h-full min-w-0 flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-6 rounded-t bg-current transition-opacity ${
                    isActive ? "opacity-100" : isLast ? "opacity-90" : "opacity-40"
                  }`}
                  style={{ height: `${pct}%` }}
                />
              </div>
            );
          })}

          {/* Rótulo do último dia — some quando o tooltip assume */}
          {!active && lastValue > 0 ? (
            <span
              className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-foreground"
              style={{
                left: `${((points.length - 0.5) / points.length) * 100}%`,
                bottom: `calc(${barPct(lastValue)}% + 4px)`
              }}
              aria-hidden="true"
            >
              {formatValue(lastValue, kind, true)}
            </span>
          ) : null}

          {active ? (
            <Tooltip
              date={active.date}
              rows={[{ label, value: formatValue(active.value, kind), tone }]}
              xPercent={activeX}
            />
          ) : null}
        </div>
      </div>
      <DateAxis points={points} />
      <SrTable caption={label} points={points} kind={kind} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Duas linhas na MESMA escala (alcance × impressões são contagens comparáveis;
// escalas independentes dariam a falsa impressão de cruzamento).

export function DualTrend({
  series,
  emptyMessage
}: {
  series: { label: string; points: ChartPoint[]; tone: Tone }[];
  emptyMessage: string;
}) {
  const drawable = series.filter(
    (entry) => entry.points.length > 0 && !allZero(entry.points)
  );
  const total = Math.max(...series.map((entry) => entry.points.length), 0);
  const hover = useHoverIndex(total);

  if (drawable.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  // Domínio compartilhado entre todas as séries (base zero p/ leitura honesta).
  const allValues = drawable.flatMap((entry) => entry.points.map((point) => point.value));
  const min = 0;
  const max = Math.max(...allValues);
  const reference = drawable[0].points;
  const active = hover.index !== null ? reference[hover.index] : null;
  const activeX = hover.index !== null ? toXPercent(hover.index, reference.length) : 0;

  return (
    <div>
      <div
        ref={hover.ref}
        {...hover.handlers}
        tabIndex={0}
        role="img"
        aria-label="Alcance e impressões por dia — use as setas para percorrer os valores"
        className="relative h-28 w-full cursor-crosshair rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cobalt/50"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {drawable.map((entry) => (
            <path
              key={entry.label}
              d={linePath(toSvgPoints(entry.points.map((point) => point.value), min, max))}
              fill="none"
              stroke="currentColor"
              className={TONE_TEXT[entry.tone]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {active ? (
          <span
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-border"
            style={{ left: `${activeX}%` }}
            aria-hidden="true"
          />
        ) : null}

        {drawable.map((entry) => {
          const last = entry.points[entry.points.length - 1];
          return (
            <span
              key={entry.label}
              className={`pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-card ${TONE_TEXT[entry.tone]}`}
              style={{
                left: `${toXPercent(entry.points.length - 1, entry.points.length)}%`,
                top: `${yPercent(last.value, min, max)}%`
              }}
              aria-hidden="true"
            />
          );
        })}

        {active ? (
          <Tooltip
            date={active.date}
            rows={drawable.map((entry) => ({
              label: entry.label,
              value: formatValue(
                entry.points[hover.index ?? 0]?.value ?? 0,
                "integer"
              ),
              tone: entry.tone
            }))}
            xPercent={activeX}
          />
        ) : null}
      </div>
      <DateAxis points={reference} />
      {drawable.map((entry) => (
        <SrTable key={entry.label} caption={entry.label} points={entry.points} kind="integer" />
      ))}
    </div>
  );
}
