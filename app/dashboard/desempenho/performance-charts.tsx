// Gráficos de tendência desenhados à mão — leves, sem dependência externa e
// 100% adaptáveis ao tema (usam `currentColor`, definido por uma classe de
// texto tokenizada). Renderizados no server component da página.
//
// Linhas/áreas são SVG (traço uniforme via vector-effect); as barras e os
// pontos de destaque são HTML para não distorcerem com o esticamento do SVG.

const VIEW_W = 100;
const VIEW_H = 36;
const PAD_Y = 3;
const USABLE_H = VIEW_H - PAD_Y * 2;

export type Tone = "cobalt" | "lagoon" | "success";

const TONE_TEXT: Record<Tone, string> = {
  cobalt: "text-cobalt",
  lagoon: "text-lagoon",
  success: "text-success"
};

function allZero(values: number[]): boolean {
  return values.every((value) => value === 0);
}

// Normaliza os valores no viewBox. Trata 1 ponto e série constante sem quebrar.
function toPoints(values: number[]): { x: number; y: number }[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
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

// Posição (em %) do último ponto — usada para o marcador HTML de destaque.
function lastPointPercent(values: number[]): { left: number; top: number } {
  const last = values[values.length - 1];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;
  const ratio = span === 0 ? 0.5 : (last - min) / span;
  const left = values.length === 1 ? 50 : 100;
  const top = ((PAD_Y + (1 - ratio) * USABLE_H) / VIEW_H) * 100;
  return { left, top };
}

function Baseline({ tone }: { tone: Tone }) {
  return (
    <div className={`flex h-24 items-center ${TONE_TEXT[tone]}`}>
      <div className="h-px w-full border-t border-dashed border-current opacity-30" />
    </div>
  );
}

// Linha + área com gradiente e marcador no ponto final. `id` deve ser único por
// instância (evita colisão de gradientes no DOM). Usado para gasto e alcance.
export function TrendArea({
  values,
  tone = "cobalt",
  id
}: {
  values: number[];
  tone?: Tone;
  id: string;
}) {
  if (values.length === 0 || allZero(values)) {
    return <Baseline tone={tone} />;
  }

  const points = toPoints(values);
  const gradientId = `trend-area-${id}`;
  const marker = lastPointPercent(values);

  return (
    <div className={`relative h-24 w-full ${TONE_TEXT[tone]}`}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.32} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${linePath(points)} L${VIEW_W} ${VIEW_H} L0 ${VIEW_H} Z`} fill={`url(#${gradientId})`} />
        <path
          d={linePath(points)}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-4 ring-card"
        style={{ left: `${marker.left}%`, top: `${marker.top}%` }}
      />
    </div>
  );
}

// Barras em HTML (flex) — cantos superiores arredondados, largura limitada e
// centralizadas quando há poucos pontos. Usado para leads e cliques.
export function TrendBars({
  values,
  tone = "cobalt"
}: {
  values: number[];
  tone?: Tone;
}) {
  const max = values.length > 0 ? Math.max(...values) : 0;

  if (values.length === 0 || max === 0) {
    return <Baseline tone={tone} />;
  }

  return (
    <div className={`flex h-24 items-end justify-center gap-[3px] ${TONE_TEXT[tone]}`}>
      {values.map((value, index) => {
        const pct = value > 0 ? Math.max((value / max) * 100, 8) : 0;
        const isLast = index === values.length - 1;
        return (
          <div
            key={index}
            className={`min-w-0 max-w-[30px] flex-1 rounded-t-[5px] bg-current ${
              isLast ? "opacity-100" : "opacity-45"
            }`}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

// Duas linhas sobrepostas com escalas independentes (cada série normalizada no
// próprio min/max) e marcadores nos pontos finais. Usado p/ alcance vs impressões.
export function DualTrend({
  series
}: {
  series: { values: number[]; tone: Tone }[];
}) {
  const drawable = series.filter((entry) => entry.values.length > 0 && !allZero(entry.values));

  if (drawable.length === 0) {
    return <Baseline tone={series[0]?.tone ?? "cobalt"} />;
  }

  return (
    <div className="relative h-24 w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {drawable.map((entry, index) => (
          <path
            key={index}
            d={linePath(toPoints(entry.values))}
            fill="none"
            stroke="currentColor"
            className={TONE_TEXT[entry.tone]}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {drawable.map((entry, index) => {
        const marker = lastPointPercent(entry.values);
        return (
          <span
            key={index}
            className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-4 ring-card ${TONE_TEXT[entry.tone]}`}
            style={{ left: `${marker.left}%`, top: `${marker.top}%` }}
          />
        );
      })}
    </div>
  );
}
