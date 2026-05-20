import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";

export function ComplianceSection() {
  return (
    <section className="section-shell pb-24" id="compliance">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt text-white shadow-soft">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <p className="mb-3 text-sm font-semibold text-cobalt uppercase tracking-wider">Compliance de anúncios</p>
          <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            Campanhas com linguagem mais segura
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/64 md:text-lg">
            A IA do Leadi ajuda a estruturar textos consultivos e o checklist aponta termos que podem gerar risco de reprovação ou bloqueio de conta nas plataformas.
          </p>
          <p className="mt-4 text-sm text-ink/48">
            * O Leadi ajuda a reduzir riscos ao apontar termos de atenção, mas a aprovação final das campanhas depende exclusivamente das regras e análise das plataformas de anúncios.
          </p>
        </div>
        <div className="space-y-4">
          <div className="glass-strong rounded-[28px] p-6 border border-red-200/20">
            <div className="mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-red-500" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">Linguagem de risco (Evitar)</span>
            </div>
            <p className="rounded-[16px] bg-red-50/50 border border-red-100 px-4 py-3.5 text-sm font-medium text-red-700">
              &ldquo;Economize garantido no seu plano de saúde agora!&rdquo;
            </p>
            <p className="mt-2 text-xs text-red-600/70 px-1">
              Promessas de economia imediata ou termos agressivos costumam acionar alertas de bloqueio.
            </p>
          </div>
          
          <div className="glass-strong rounded-[28px] p-6 border border-emerald-200/20">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-semibold">Linguagem recomendada (Preferir)</span>
            </div>
            <p className="rounded-[16px] bg-emerald-50/40 border border-emerald-100 px-4 py-3.5 text-sm font-medium text-emerald-800">
              &ldquo;Compare alternativas de plano empresarial para sua empresa com suporte especializado.&rdquo;
            </p>
            <p className="mt-2 text-xs text-emerald-700/70 px-1">
              Uma abordagem consultiva e voltada à comparação reduz bloqueios e atrai leads qualificados.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

