import { LegalPage } from "@/components/public/legal-page";
import { buildLegalMetadata } from "@/lib/site/legal";

export const metadata = buildLegalMetadata({
  title: "Politica de Privacidade",
  pathname: "/privacy",
  description:
    "Politica publica de privacidade da LeadHealth para operacao do CRM, integracoes Meta, IA, pagamentos e suporte."
});

const sections = [
  {
    title: "1. Escopo",
    body: [
      "A LeadHealth e uma plataforma SaaS voltada para captacao, organizacao e acompanhamento de leads comerciais no contexto de planos de saude empresariais. Esta politica descreve como dados pessoais e dados operacionais podem ser tratados durante o uso do produto.",
      "Esta versao foi preparada para publicacao em ambiente inicial e pode ser atualizada conforme evolucao do servico, das integracoes contratadas e das exigencias legais aplicaveis."
    ]
  },
  {
    title: "2. Dados que podem ser tratados",
    body: [
      "A plataforma pode armazenar dados enviados diretamente por usuarios da LeadHealth ou por integracoes autorizadas, incluindo nome, telefone, email, empresa, cidade, interesses comerciais, historico de contato, payloads tecnicos de webhook e identificadores de campanha ou formulario.",
      "Tambem podem ser tratados dados de conta e operacao, como emails de acesso, perfis de equipe, logs de uso, creditos consumidos, registros de autenticacao e eventos administrativos necessarios para manter o servico funcionando."
    ]
  },
  {
    title: "3. Finalidades de uso",
    body: [
      "Os dados podem ser usados para receber leads, distribuir oportunidades entre membros da equipe, gerar campanhas e mensagens assistidas por IA, registrar auditoria operacional, prevenir abusos e oferecer suporte tecnico.",
      "Quando recursos de IA estiverem ativos, trechos de contexto comercial podem ser enviados a provedores externos estritamente para executar a funcionalidade solicitada pelo usuario, sempre conforme a configuracao tecnica disponivel na plataforma."
    ]
  },
  {
    title: "4. Bases e compartilhamento",
    body: [
      "O tratamento pode ocorrer com base na execucao dos servicos contratados, no atendimento de obrigacoes legais, no exercicio regular de direitos e em interesses legitimos relacionados a seguranca, prevencao a fraude, auditoria e continuidade do produto.",
      "A LeadHealth pode integrar servicos como Supabase para banco e autenticacao, provedores de IA para geracao assistida, plataformas de pagamento e conectores de marketing ou automacao, como Meta Lead Ads, Make ou Zapier. Esses compartilhamentos ocorrem apenas na medida necessaria para executar o produto e suas integracoes."
    ]
  },
  {
    title: "5. Retencao, seguranca e transferencias",
    body: [
      "A LeadHealth adota medidas tecnicas e organizacionais razoaveis para reduzir risco de acesso indevido, alteracao, perda ou divulgacao nao autorizada de dados. Isso pode incluir segregacao por organizacao, controles de acesso por perfil, logs e protecao de credenciais.",
      "Os dados podem ser mantidos enquanto houver necessidade operacional, contratual, de suporte, seguranca ou auditoria. O tempo exato de retencao pode variar conforme a configuracao de cada cliente, exigencias regulatorias, prazos legais e a evolucao do produto.",
      "Parte do processamento pode envolver fornecedores com infraestrutura fora do Brasil. Nesses casos, a LeadHealth busca adotar salvaguardas contratuais e tecnicas compativeis com a natureza do servico."
    ]
  },
  {
    title: "6. Direitos, exclusao e contato",
    body: [
      "Solicitacoes sobre dados, revisoes cadastrais, exclusao, exportacao ou esclarecimentos de privacidade podem ser encaminhadas pelos canais oficiais da LeadHealth informados neste dominio ou no relacionamento comercial.",
      "Pedidos ligados a dados originados por integracoes Meta tambem podem seguir as instrucoes publicadas em /data-deletion, sem prejuizo de validacao de identidade e de eventuais obrigacoes legais de retencao.",
      "Antes da operacao em escala ou de exigencias regulatorias especificas, recomenda-se revisar este documento com assessoria juridica para adequa-lo ao modelo comercial definitivo da empresa."
    ]
  }
] as const;

export default function PrivacyPage() {
  return (
    <LegalPage
      effectiveDate="05/05/2026"
      eyebrow="Privacidade"
      sections={[...sections]}
      summary="Como a LeadHealth pode tratar dados de leads, equipes, campanhas, pagamentos e integracoes durante a operacao do CRM."
      title="Politica de Privacidade"
    />
  );
}
