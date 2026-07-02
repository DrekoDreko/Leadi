import type { ComponentType, ReactNode } from "react";
import { Eye } from "lucide-react";
import { DualTrend, type ChartPoint, type Tone } from "./performance-charts";

// Tints por métrica: cor mais presente que antes (referência bento), mas sempre
// via tokens --chart-* que adaptam ao tema.
export const CARD_TONE: Record<Tone, { tint: string; dot: string; chip: string }> = {
  blue: {
    tint: "from-chart-blue/[0.14]",
    dot: "bg-chart-blue",
    chip: "bg-chart-blue/12 text-chart-blue"
  },
  teal: {
    tint: "from-chart-teal/[0.14]",
    dot: "bg-chart-teal",
    chip: "bg-chart-teal/12 text-chart-teal"
  },
  green: {
    tint: "from-chart-green/[0.16]",
    dot: "bg-chart-green",
    chip: "bg-chart-green/12 text-chart-green"
  }
};

export function MetricCard({
  label,
  sublabel,
  value,
  tone,
  icon: Icon,
  hero = false,
  footer,
  className = "",
  children
}: {
  label: string;
  sublabel: string;
  value: string;
  tone: Tone;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  hero?: boolean;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const toneClasses = CARD_TONE[tone];
  return (
    <div className={`surface-card-muted relative overflow-hidden rounded-[26px] p-5 ${className}`}>
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneClasses.tint} via-transparent to-transparent`}
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className={`inline-block h-2 w-2 rounded-full ${toneClasses.dot}`} />
              {label}
            </p>
            <strong
              className={`mt-1.5 block font-semibold ${hero ? "text-3xl md:text-4xl" : "text-3xl"}`}
            >
              {value}
            </strong>
            <p className="text-muted-soft mt-1 text-xs">{sublabel}</p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClasses.chip}`}
          >
            <Icon size={18} aria-hidden={true} />
          </div>
        </div>
        <div className="mt-4 flex-1">{children}</div>
        {footer ? <div className="mt-4 border-t border-border pt-3">{footer}</div> : null}
      </div>
    </div>
  );
}

// Card duplo — Alcance + Impressões na mesma escala, compartilhado entre a
// página de campanhas e a página de desempenho por anúncio.
export function ReachImpressionsCard({
  reachValue,
  impressionsValue,
  reachPoints,
  impressionsPoints,
  className = ""
}: {
  reachValue: string;
  impressionsValue: string;
  reachPoints: ChartPoint[];
  impressionsPoints: ChartPoint[];
  className?: string;
}) {
  return (
    <div className={`surface-card-muted relative overflow-hidden rounded-[26px] p-5 ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-chart-blue/[0.1] via-transparent to-transparent"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-chart-blue" />
                Alcance
              </p>
              <strong className="mt-1.5 block text-3xl font-semibold">{reachValue}</strong>
              <p className="text-muted-soft mt-1 text-xs">Pessoas alcançadas</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-chart-teal" />
                Impressões
              </p>
              <strong className="mt-1.5 block text-3xl font-semibold">{impressionsValue}</strong>
              <p className="text-muted-soft mt-1 text-xs">Vezes que o anúncio apareceu</p>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-chart-blue/12 text-chart-blue">
            <Eye size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4">
          <DualTrend
            series={[
              { label: "Alcance", points: reachPoints, tone: "blue" },
              { label: "Impressões", points: impressionsPoints, tone: "teal" }
            ]}
            emptyMessage="Sem dados de alcance neste período."
          />
        </div>
      </div>
    </div>
  );
}
