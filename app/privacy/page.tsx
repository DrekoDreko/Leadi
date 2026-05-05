import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Politica de Privacidade | LeadHealth",
  description:
    "Rascunho publico da politica de privacidade da LeadHealth para operacao inicial da plataforma."
};

const sections = [
  {
    title: "1. Escopo",
    body: [
      "A LeadHealth e uma plataforma SaaS voltada para captacao, organizacao e acompanhamento de leads comerciais no contexto de planos de saude empresariais. Esta politica descreve, em linguagem operacional, como dados podem ser coletados, usados e protegidos durante o uso do produto.",
      "Este texto e um rascunho informativo para publicacao inicial do servico. Ele nao substitui revisao juridica especifica sobre LGPD, contratos, bases legais ou politicas internas de cada cliente."
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
    title: "4. Compartilhamento e integracoes",
    body: [
      "A LeadHealth pode integrar servicos como Supabase para banco e autenticacao, provedores de IA para geracao assistida, plataformas de pagamento, e conectores de marketing ou automacao, como Meta Lead Ads, Make ou Zapier.",
      "Esses compartilhamentos ocorrem apenas na medida necessaria para executar o produto, processar requisicoes tecnicas, registrar eventos ou cumprir obrigacoes operacionais do servico."
    ]
  },
  {
    title: "5. Retencao e seguranca",
    body: [
      "A LeadHealth adota medidas tecnicas e organizacionais razoaveis para reduzir risco de acesso indevido, alteracao, perda ou divulgacao nao autorizada de dados. Isso pode incluir segregacao por organizacao, controles de acesso por perfil, logs e protecao de credenciais.",
      "Os dados podem ser mantidos enquanto houver necessidade operacional, contratual, de suporte, seguranca ou auditoria. O tempo exato de retencao pode variar conforme a configuracao de cada cliente e a evolucao do produto."
    ]
  },
  {
    title: "6. Direitos e contato",
    body: [
      "Solicitacoes sobre dados, revisoes cadastrais, exclusao, exportacao ou esclarecimentos de privacidade podem ser encaminhadas pelos canais oficiais da LeadHealth informados no site ou no relacionamento comercial.",
      "Antes da operacao em escala ou de exigencias regulatórias especificas, recomenda-se revisar este documento com assessoria juridica para adequa-lo ao modelo comercial definitivo da empresa."
    ]
  }
] as const;

export default function PrivacyPage() {
  return (
    <LegalPage
      effectiveDate="05/05/2026"
      eyebrow="Privacidade"
      sections={[...sections]}
      summary="Como a LeadHealth pode tratar dados de leads, equipes, campanhas e integracoes durante a operacao inicial do CRM."
      title="Politica de Privacidade"
    />
  );
}
