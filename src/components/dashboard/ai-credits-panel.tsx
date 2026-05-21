import { Banknote, Sparkles } from "lucide-react";

export function AiCreditsPanel({
  balance
}: {
  balance: number;
}) {
  const balanceLabel = balance.toLocaleString("pt-BR");

  return (
    <article className="glass-strong rounded-[34px] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-cobalt">Créditos de IA</p>
          <h3 className="mt-2 text-xl font-semibold">Saldo de IA</h3>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            Você possui {balanceLabel} créditos de IA disponíveis.
          </p>
        </div>
        <Banknote size={20} aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoTile label="Saldo atual" value={`${balanceLabel} créditos`} />
        <InfoTile label="Uso" value="Campanhas, mensagens e compliance" />
        <InfoTile label="Status" value={balance > 0 ? "Ativo" : "Sem saldo"} />
      </div>

      <p className="mt-5 text-sm leading-6 text-ink/64">
        Os créditos de IA são consumidos quando a plataforma gera campanhas, copies, mensagens ou
        análises automatizadas.
      </p>

      {balance <= 0 ? (
        <div className="mt-4 rounded-[22px] bg-signal/20 px-4 py-3 text-sm font-semibold text-ink dark:text-cloud">
          Seu saldo de IA acabou. Adicione créditos ou atualize seu plano para continuar usando
          recursos de IA.
        </div>
      ) : null}

      <button
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink/10 px-4 py-3 text-sm font-semibold text-ink/62"
        disabled
        type="button"
      >
        <Sparkles size={18} aria-hidden="true" />
        Comprar créditos - em breve
      </button>
    </article>
  );
}

export function OpenAIComingSoonCard({
  highlight = false
}: {
  highlight?: boolean;
}) {
  return (
    <article
      className={`glass-strong rounded-[34px] p-5 md:p-6 ${highlight ? "ring-2 ring-lagoon/24" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full bg-lagoon/12 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-lagoon">
            Em breve
          </p>
          <h3 className="mt-3 text-xl font-semibold">Conta OpenAI própria</h3>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            Em breve você poderá conectar sua própria conta OpenAI para usar sua estrutura de IA
            diretamente no Leadi. Por enquanto, as gerações usam os Créditos de IA do
            plataforma.
          </p>
        </div>
        <Sparkles size={20} aria-hidden="true" />
      </div>

      <div className="mt-5 rounded-[22px] bg-white/58 px-4 py-3 text-sm leading-6 text-ink/64">
        Recurso reservado para uma próxima etapa da plataforma. Hoje, o fluxo principal usa a
        chave global do Leadi e o saldo interno de créditos.
      </div>

      <button
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink/62"
        disabled
        type="button"
      >
        Disponível em breve
      </button>
    </article>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/58 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
