import { LegalPage } from "@/components/public/legal-page";
import { buildLegalMetadata } from "@/lib/site/legal";

export const metadata = buildLegalMetadata({
  title: "Exclusao de Dados",
  pathname: "/data-deletion",
  description:
    "Instrucoes publicas para revogar integracoes Meta e solicitar exclusao de dados tratados pela LeadHealth."
});

const sections = [
  {
    title: "1. Revogar o app na Meta",
    body: [
      "Se voce conectou uma conta, pagina ou formulario da Meta a LeadHealth, pode revogar o acesso diretamente no painel da propria Meta em Configuracoes > Aplicativos e sites ou na area equivalente do produto utilizado.",
      "Ao remover a integracao do seu lado na Meta, novos compartilhamentos via aquele app deixam de ocorrer, mas isso nao apaga automaticamente dados que ja tenham sido recebidos e processados pela operacao comercial."
    ]
  },
  {
    title: "2. Solicitar exclusao na LeadHealth",
    body: [
      "Para solicitar exclusao de dados armazenados pela LeadHealth, envie o pedido pelos canais oficiais informados neste dominio, identificando a conta, organizacao, pagina ou lead envolvido e descrevendo a solicitacao.",
      "Por seguranca, a LeadHealth pode pedir confirmacao de identidade ou prova de autorizacao antes de executar exclusoes que afetem dados de equipes, clientes ou terceiros."
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
      "A LeadHealth busca analisar e responder pedidos de exclusao em prazo razoavel, considerando complexidade, volume de dados, validacao da identidade e obrigacoes legais aplicaveis.",
      "Quando cabivel, a resposta informa se o pedido foi concluido integralmente, parcialmente ou se existe base legal para retencao de parte dos dados."
    ]
  }
] as const;

export default function DataDeletionPage() {
  return (
    <LegalPage
      effectiveDate="05/05/2026"
      eyebrow="Dados"
      sections={[...sections]}
      summary="Como revogar integracoes Meta e solicitar exclusao de dados mantidos pela LeadHealth."
      title="Exclusao de Dados"
    />
  );
}
