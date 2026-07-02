// Gráficos de tendência desenhados à mão em SVG — leves, sem dependência
// externa e 100% adaptáveis ao tema (usam `currentColor`, definido por uma
// classe de texto tokenizada). Renderizados no server component da página.

const VIEW_W = 100;
const VIEW_H = 36;
const PAD_Y = 3;

type Tone = "cobalt" | "lagoon";

const TONE_TEXT: Record<Tone, string> = {
  cobalt: "text-cobalt",
  lagoon: "text-lagoon"
};

// Normaliza os valores no viewBox. Trata série vazia, 1 ponto e série constante
// (todos iguais) sem quebrar — nesses casos desenha uma linha central chata.
function toPoints(values: number[]): { x: number; y: number }[] {
  if (values.length === 0) {
    return [];
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;
  const usableH = VIEW_H - PAD_Y * 2;

  return values.map((value, index) => {
    const x =
      values.length === 1 ? VIEW_W / 2 : (index / (values.length - 1)) * VIEW_W;
    const ratio = span === 0 ? 0.5 : (value - min) / span;
    const y = VIEW_H - PAD_Y - ratio * usableH;
    return { x, y };
  });
}

function linePath(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function EmptyBaseline() {
  return (
    <line
      x1="0"
      y1={VIEW_H / 2}
      x2={VIEW_W}
      y2={VIEW_H / 2}
      stroke="currentColor"
      strokeOpacity={0.25}
      strokeWidth={1}
      strokeDasharray="3 3"
      vectorEffect="non-scaling-stroke"
    />
  );
}

// Linha + área com gradiente. `id` deve ser único por instância (colisão de
// gradientes no DOM). Usado para gasto, alcance, etc.
export function TrendArea({
  values,
  tone = "cobalt",
  id
}: {
  values: number[];
  tone?: Tone;
  id: string;
}) {
  const points = toPoints(values);
  const gradientId = `trend-area-${id}`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className={`h-20 w-full ${TONE_TEXT[tone]}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.24} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      {points.length === 0 ? (
        <EmptyBaseline />
      ) : (
        <>
          <path
            d={`${linePath(points)} L${VIEW_W} ${VIEW_H} L0 ${VIEW_H} Z`}
            fill={`url(#${gradientId})`}
          />
          <path
            d={linePath(points)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={2.4}
            fill="currentColor"
          />
        </>
      )}
    </svg>
  );
}

// Mini-barras. Usado para leads e cliques.
export function TrendBars({
  values,
  tone = "cobalt"
}: {
  values: number[];
  tone?: Tone;
}) {
  const max = values.length > 0 ? Math.max(...values) : 0;
  const usableH = VIEW_H - PAD_Y * 2;
  const count = Math.max(values.length, 1);
  const gap = count > 40 ? 0.4 : 1.2;
  const barW = Math.max((VIEW_W - gap * (count - 1)) / count, 0.6);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className={`h-20 w-full ${TONE_TEXT[tone]}`}
      aria-hidden="true"
    >
      {values.length === 0 ? (
        <EmptyBaseline />
      ) : (
        values.map((value, index) => {
          const ratio = max === 0 ? 0 : value / max;
          const barH = Math.max(ratio * usableH, value > 0 ? 1.5 : 0);
          const x = index * (barW + gap);
          const y = VIEW_H - PAD_Y - barH;
          return (
            <rect
              key={index}
              x={x.toFixed(2)}
              y={y.toFixed(2)}
              width={barW.toFixed(2)}
              height={barH.toFixed(2)}
              rx={0.8}
              fill="currentColor"
              fillOpacity={index === values.length - 1 ? 1 : 0.55}
            />
          );
        })
      )}
    </svg>
  );
}

// Duas linhas sobrepostas com escalas independentes (cada série normalizada no
// próprio min/max). Usado para alcance vs impressões.
export function DualTrend({
  series
}: {
  series: { values: number[]; tone: Tone }[];
}) {
  const hasData = series.some((entry) => entry.values.length > 0);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className="h-20 w-full text-cobalt"
      aria-hidden="true"
    >
      {!hasData ? (
        <EmptyBaseline />
      ) : (
        series.map((entry, index) => {
          const points = toPoints(entry.values);
          if (points.length === 0) {
            return null;
          }
          return (
            <path
              key={index}
              d={linePath(points)}
              fill="none"
              stroke="currentColor"
              className={TONE_TEXT[entry.tone]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })
      )}
    </svg>
  );
}
