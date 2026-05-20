import { LegalPage } from "@/components/public/legal-page";
import { buildLegalMetadata } from "@/lib/site/legal";

export const metadata = buildLegalMetadata({
  title: "Exclusao de Dados",
  pathname: "/data-deletion",
  description:
    "Instrucoes publicas para revogar integracoes Meta e solicitar exclusao de dados tratados pelo Leadi."
});

type DataDeletionPageProps = {
  searchParams?: Promise<{
    code?: string;
    status?: string;
  }>;
};

const sections = [
  {
    title: "1. Revogar o app na Meta",
    body: [
      "Se voce conectou uma conta, pagina ou formulario da Meta ao Leadi, pode revogar o acesso diretamente no painel da propria Meta em Configuracoes > Aplicativos e sites ou na area equivalente do produto utilizado.",
      "Ao remover a integracao do seu lado na Meta, novos compartilhamentos via aquele app deixam de ocorrer, mas isso nao apaga automaticamente dados que ja tenham sido recebidos e processados pela operacao comercial."
    ]
  },
  {
    title: "2. Solicitar exclusao no Leadi",
    body: [
      "Para solicitar exclusao de dados armazenados pelo Leadi, envie o pedido pelos canais oficiais informados neste dominio, identificando a conta, organizacao, pagina ou lead envolvido e descrevendo a solicitacao.",
      "Por seguranca, o Leadi pode pedir confirmacao de identidade ou prova de autorizacao antes de executar exclusoes que afetem dados de equipes, clientes ou terceiros."
    ]
  },
  {
    title: "3. O que pode ser excluido",
    body: [
      "Em regra, a solicitacao pode abranger dados de conta, registros de integracao, leads recebidos, historicos de interacao e informacoes operacionais associadas, observadas as configuracoes do workspace e a natureza do pedido.",
      "Alguns registros tecnicos, fiscais, antifraude, auditoria ou seguranca podem ser mantidos pelo periodo minimo necessario para cumprimento de obrigacoes legais ou defesa de direitos."
    ]
  },
  {
    title: "4. Prazo e confirmacao",
    body: [
      "O Leadi busca analisar e responder pedidos de exclusao em prazo razoavel, considerando complexidade, volume de dados, validacao da identidade e obrigacoes legais aplicaveis.",
      "Quando cabivel, a resposta informa se o pedido foi concluido integralmente, parcialmente ou se existe base legal para retencao de parte dos dados."
    ]
  }
] as const;

export default async function DataDeletionPage({ searchParams }: DataDeletionPageProps) {
  const params = await searchParams;
  const confirmationCode = params?.code?.trim() ?? "";
  const statusLabel = params?.status?.trim() ?? "";

  const intro = confirmationCode ? (
    <article className="glass rounded-[30px] p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cobalt">
        Status da solicitação
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-ink">Exclusão recebida pela Meta</h2>
      <p className="mt-3 text-sm leading-7 text-ink/72 md:text-base">
        {statusLabel === "received"
          ? "A solicitação foi recebida e a integração vinculada foi removida ou desativada no lado do Leadi."
          : "A solicitação foi recebida e está em processamento no lado do Leadi."}
      </p>
      <div className="mt-5 rounded-2xl bg-ink px-4 py-3 font-mono text-sm text-white">
        {confirmationCode}
      </div>
      <p className="mt-4 text-sm leading-7 text-ink/68">
        Se você chegou aqui a partir da Meta, mantenha este código para referência. A exclusão
        já foi encaminhada no backend do Leadi.
      </p>
    </article>
  ) : null;

  return (
    <LegalPage
      effectiveDate="05/05/2026"
      eyebrow="Dados"
      intro={intro}
      sections={[...sections]}
      summary="Como revogar integrações Meta, acompanhar solicitações e pedir exclusão de dados mantidos pelo Leadi."
      title="Exclusao de Dados"
    />
  );
}
