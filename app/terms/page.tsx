import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso | LeadHealth",
  description:
    "Rascunho publico dos termos de uso da LeadHealth para operacao inicial da plataforma."
};

const sections = [
  {
    title: "1. Objeto do servico",
    body: [
      "A LeadHealth disponibiliza uma plataforma online para organizacao de leads, gestao comercial, criacao assistida de campanhas, operacao de equipe e integracoes com ferramentas de marketing, IA, automacao e pagamento.",
      "Os recursos disponiveis podem variar conforme o plano contratado, o ambiente tecnico configurado e a maturidade do produto. Funcionalidades em fase inicial podem sofrer ajustes sem aviso previo para melhoria continua."
    ]
  },
  {
    title: "2. Responsabilidades do cliente",
    body: [
      "O cliente e responsavel pelas informacoes inseridas na plataforma, pela regularidade do uso comercial de leads, pelo controle interno da equipe e pela configuracao correta de credenciais, webhooks, paginas, formularios e provedores conectados.",
      "Tambem cabe ao cliente revisar campanhas, textos, respostas sugeridas e automacoes antes da publicacao ou envio a terceiros, especialmente em contextos regulados, sensiveis ou que exijam aprovacao interna."
    ]
  },
  {
    title: "3. Uso aceitavel",
    body: [
      "Nao e permitido utilizar a LeadHealth para violar leis, direitos de terceiros, politicas de plataformas integradas, obrigacoes contratuais ou regras de publicidade aplicaveis ao setor de saude e planos empresariais.",
      "O cliente nao deve tentar contornar limites tecnicos, acessar dados de outras organizacoes, explorar vulnerabilidades, automatizar abuso da plataforma ou utilizar conteudo gerado como se fosse garantia juridica, medica ou comercial."
    ]
  },
  {
    title: "4. Integracoes, IA e terceiros",
    body: [
      "A LeadHealth pode depender de servicos de terceiros para autenticacao, banco, pagamentos, modelos de IA, mensageria e APIs externas. A disponibilidade dessas integracoes pode impactar partes da experiencia.",
      "Quando o cliente habilita uma integracao, ele declara ter permissao para conectar a origem de dados correspondente e reconhece que regras, limites e revisoes de terceiros, como Meta, podem influenciar o funcionamento da funcionalidade."
    ]
  },
  {
    title: "5. Disponibilidade e limitacao",
    body: [
      "A plataforma e oferecida em base de esforco comercialmente razoavel. Podem ocorrer indisponibilidades, manutencoes, ajustes de layout, mudancas de fluxo e limitacoes temporarias, especialmente em ambientes de teste, homologacao ou rollout inicial.",
      "Na extensao permitida pela legislacao aplicavel, a LeadHealth nao garante resultados comerciais especificos, aprovacao automatica por plataformas externas, conformidade juridica absoluta ou ausencia total de falhas."
    ]
  },
  {
    title: "6. Vigencia e atualizacoes",
    body: [
      "Estes termos podem ser atualizados conforme a evolucao do produto, da operacao comercial e das integracoes suportadas. A versao publicada nesta URL serve como referencia publica inicial para uso da plataforma.",
      "Antes da contratacao definitiva em escala, recomenda-se consolidar estes termos com apoio juridico e comercial para refletir precificacao, SLA, suporte, cancelamento, privacidade e demais condicoes aplicaveis."
    ]
  }
] as const;

export default function TermsPage() {
  return (
    <LegalPage
      effectiveDate="05/05/2026"
      eyebrow="Termos"
      sections={[...sections]}
      summary="Condicoes operacionais iniciais para uso da LeadHealth como CRM SaaS com IA, integracoes e captacao de leads."
      title="Termos de Uso"
    />
  );
}
