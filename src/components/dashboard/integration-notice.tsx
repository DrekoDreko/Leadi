import { AlertTriangle } from "lucide-react";

type IntegrationNoticeProps = {
  message: string;
  title?: string;
  tone?: "info" | "warning";
};

export function IntegrationNotice({ message, title, tone = "info" }: IntegrationNoticeProps) {
  if (tone === "warning") {
    return (
      <div className="rounded-[22px] border border-amber-300/70 bg-amber-50/90 px-4 py-3 text-amber-950">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={18} aria-hidden="true" />
          <div className="space-y-1">
            {title ? <p className="text-sm font-semibold">{title}</p> : null}
            <p className="text-sm leading-6 text-amber-900/92">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return <p className="rounded-[22px] bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink">{message}</p>;
}
