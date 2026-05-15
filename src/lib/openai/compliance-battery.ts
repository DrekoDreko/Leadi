export type ComplianceBatteryBucket = "safe" | "questionable" | "prohibited";

export type ComplianceBatteryCase = {
  id: string;
  bucket: ComplianceBatteryBucket;
  label: string;
  text: string;
  expectedReasonTitles?: string[];
};

export const complianceBatteryCases: ComplianceBatteryCase[] = [
  {
    id: "safe-cotacao-consultiva",
    bucket: "safe",
    label: "Seguro: cotacao consultiva para empresas",
    text:
      "Solicite uma cotacao consultiva de plano de saude empresarial para sua empresa. Informe cidade, faixa de vidas e melhor horario para contato."
  },
  {
    id: "safe-comparacao-regional",
    bucket: "safe",
    label: "Seguro: comparacao comercial por regiao",
    text:
      "Compare alternativas de plano empresarial para equipes em Campinas e regiao com apoio comercial para analisar rede, prazo e implantacao."
  },
  {
    id: "safe-qualificacao-basica",
    bucket: "safe",
    label: "Seguro: formulario inicial basico",
    text:
      "Preencha nome, WhatsApp, cidade da empresa e quantidade aproximada de vidas para receber orientacao comercial sobre planos empresariais."
  },
  {
    id: "safe-renovacao-empresa",
    bucket: "safe",
    label: "Seguro: renovacao e analise de proposta",
    text:
      "Sua empresa vai renovar o beneficio? Fale com a equipe do Leadi para comparar propostas e organizar os proximos passos da cotacao."
  },
  {
    id: "questionable-superlativo",
    bucket: "questionable",
    label: "Duvidoso: superlativo absoluto",
    text:
      "Encontre o melhor plano empresarial para sua equipe com atendimento especializado e apoio para comparar opcoes.",
    expectedReasonTitles: ["Superlativo absoluto"]
  },
  {
    id: "questionable-urgencia",
    bucket: "questionable",
    label: "Duvidoso: urgencia agressiva",
    text:
      "Somente hoje: solicite sua cotacao empresarial e fale com um consultor antes que as vagas acabem.",
    expectedReasonTitles: ["Urgencia agressiva"]
  },
  {
    id: "questionable-facilidade",
    bucket: "questionable",
    label: "Duvidoso: facilidade simplificada demais",
    text:
      "Cotacao empresarial sem burocracia e com ajuda para agilizar o seu proximo passo comercial.",
    expectedReasonTitles: ["Facilidade enganosa"]
  },
  {
    id: "questionable-dados-pessoais",
    bucket: "questionable",
    label: "Duvidoso: coleta cedo demais",
    text:
      "Para receber a proposta, envie CPF, data de nascimento e cidade da empresa no primeiro contato.",
    expectedReasonTitles: ["Coleta excessiva no primeiro contato"]
  },
  {
    id: "prohibited-saude-sensivel",
    bucket: "prohibited",
    label: "Proibido: condicao de saude",
    text:
      "Plano ideal para diabeticos e gestantes que precisam de cobertura imediata.",
    expectedReasonTitles: ["Atributo de saude sensivel", "Promessa forte ou garantia"]
  },
  {
    id: "prohibited-atributo-protegido",
    bucket: "prohibited",
    label: "Proibido: segmentacao por atributo protegido",
    text:
      "Campanha exclusiva para idosos e aposentados que querem migrar de plano agora.",
    expectedReasonTitles: ["Segmentacao por atributo protegido"]
  },
  {
    id: "prohibited-compliance-garantido",
    bucket: "prohibited",
    label: "Proibido: compliance como garantia absoluta",
    text:
      "Leadi entrega compliance garantido e sem risco de reprovacao na Meta para sua campanha.",
    expectedReasonTitles: ["Promessa forte ou garantia"]
  },
  {
    id: "prohibited-meta-aprovacao",
    bucket: "prohibited",
    label: "Proibido: aprovacao Meta garantida",
    text:
      "Crie seu anuncio com aprovacao garantida na Meta e reprovacao zero.",
    expectedReasonTitles: ["Promessa forte ou garantia"]
  },
  {
    id: "prohibited-blindado",
    bucket: "prohibited",
    label: "Proibido: blindagem contra reprovação",
    text:
      "Texto blindado contra reprovacao, 100% aprovado e pronto para escalar no Meta Ads.",
    expectedReasonTitles: ["Promessa forte ou garantia"]
  },
  {
    id: "prohibited-saude-extra",
    bucket: "prohibited",
    label: "Proibido: condicoes de saude menos obvias",
    text:
      "Campanha para empresas com equipes afetadas por ansiedade, autismo e obesidade.",
    expectedReasonTitles: ["Atributo de saude sensivel"]
  }
];
