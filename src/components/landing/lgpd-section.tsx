import { Lock } from "lucide-react";

const points = [
  "Organização de dados de leads com controle de acesso",
  "Estrutura preparada para autenticação segura",
  "Boas práticas de privacidade desde o design",
  "Exclusão de dados mediante solicitação",
  "Adequação à LGPD como prioridade do produto",
  "Sem compartilhamento de dados com terceiros sem consentimento"
];

export function LGPDSection() {
  return (
    <section className="section-shell pb-24" id="privacidade">
      <div className="glass-strong rounded-[40px] p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cloud shadow-soft">
              <Lock size={20} aria-hidden="true" />
            </span>
            <p className="mb-3 text-sm font-medium text-cobalt">Privacidade e LGPD</p>
            <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
              Dados comerciais tratados com responsabilidade
            </h2>
            <p className="mt-4 text-lg leading-7 text-ink/64">
              O Leadi é desenvolvido com atenção às boas práticas de privacidade e segurança de dados. A adequação à LGPD é uma prioridade contínua do produto.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-[18px] bg-surface-elevated px-4 py-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-cobalt" aria-hidden="true" />
                <span className="text-sm text-ink/75">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
