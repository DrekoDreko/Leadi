import { CreditCard, Sparkles } from "lucide-react";

export function CompanyPlanSection() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cobalt/8">
        <CreditCard size={24} className="text-cobalt" />
      </span>
      <div>
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-ink">Gestão de plano e pagamento</h3>
          <span className="rounded-full bg-signal/15 px-3 py-0.5 text-[11px] font-semibold text-signal border border-signal/28">
            <Sparkles size={10} className="inline mr-1" />
            Em breve
          </span>
        </div>
        <p className="mt-2 max-w-md text-sm text-ink/50">
          Em breve você poderá gerenciar seu plano, método de pagamento e histórico de faturas
          diretamente por aqui.
        </p>
      </div>
    </div>
  );
}
