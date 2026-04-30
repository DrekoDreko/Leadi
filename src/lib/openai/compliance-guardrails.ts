export type ComplianceReason = {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
};

export type LocalComplianceReview = {
  riskLevel: "low" | "medium" | "high";
  score: number;
  reasons: ComplianceReason[];
  suggestions: string[];
  rewrittenText: string;
  disclaimer: string;
  analysisSource: "local";
  aiWarning: string;
};

export type LocalComplianceRule = {
  title: string;
  detail: string;
  severity: ComplianceReason["severity"];
  suggestion: string;
  pattern: RegExp;
};

export const DEFAULT_COMPLIANCE_DISCLAIMER =
  "Esta validacao ajuda a reduzir riscos de linguagem, mas nao substitui revisao juridica, regulatoria ou comercial.";

export const LOCAL_COMPLIANCE_RULES: LocalComplianceRule[] = [
  {
    title: "Atributo de saude sensivel",
    detail:
      "O texto menciona condicao de saude, diagnostico, tratamento ou situacao medica que pode gerar risco em anuncios.",
    severity: "high",
    suggestion:
      "Troque referencias pessoais de saude por criterios comerciais, como empresa, regiao e interesse em cotacao.",
    pattern:
      /doen[cç]a|diagn[oó]stic|hist[oó]rico m[eé]dico|tratamento|cirurgia|medicamento|diabetes|c[aâ]ncer|gestante|gravidez|depress[aã]o/i
  },
  {
    title: "Segmentacao por atributo protegido",
    detail:
      "A mensagem parece direcionar pessoas por idade, deficiencia, religiao, etnia, genero ou outro atributo protegido.",
    severity: "high",
    suggestion:
      "Direcione a campanha para decisores, empresas, regioes atendidas e necessidades de cotacao empresarial.",
    pattern:
      /idos[ao]s?|aposentad[ao]s?|defici[eê]ncia|religiao|religi[aã]o|etnia|g[eê]nero|mulheres|homens|lgbt|orienta[cç][aã]o sexual/i
  },
  {
    title: "Promessa forte ou garantia",
    detail:
      "Promessas de aprovacao, economia, cobertura ou resultado garantido podem criar expectativa indevida.",
    severity: "high",
    suggestion:
      "Use linguagem de analise, comparacao e simulacao, deixando claro que condicoes dependem de operadora e contrato.",
    pattern:
      /garantid[ao]s?|aprova[cç][aã]o garantida|cobertura total|sem car[eê]ncia|economia garantida|resultado garantido|cobertura imediata/i
  },
  {
    title: "Urgencia agressiva",
    detail:
      "Expressoes de escassez ou urgencia podem soar enganosas quando nao ha regra comercial verificavel.",
    severity: "medium",
    suggestion:
      "Prefira chamadas objetivas, como solicitar cotacao, comparar alternativas ou falar com um consultor.",
    pattern: /[uú]ltima chance|somente hoje|imperd[ií]vel|corra|vagas limitadas|nao perca/i
  },
  {
    title: "Coleta excessiva no primeiro contato",
    detail:
      "Pedir documentos, renda pessoal ou dados muito sensiveis cedo demais aumenta o risco de privacidade.",
    severity: "medium",
    suggestion:
      "No formulario inicial, colete apenas dados comerciais necessarios para contato e qualificacao.",
    pattern: /cpf|rg|renda pessoal|sal[aá]rio|data de nascimento|estado civil/i
  },
  {
    title: "Superlativo absoluto",
    detail:
      "Afirmacoes absolutas como melhor, mais barato ou ideal para todos podem exigir comprovacao forte.",
    severity: "medium",
    suggestion:
      "Substitua por beneficios verificaveis, comparacao consultiva e adequacao ao perfil da empresa.",
    pattern: /melhor plano|mais barato|ideal para todos|perfeito para todos|zero risco/i
  },
  {
    title: "Facilidade enganosa",
    detail:
      "Promessas de facilidade total podem omitir analise, elegibilidade ou etapas operacionais relevantes.",
    severity: "medium",
    suggestion:
      "Prefira explicar que a equipe ajuda a organizar comparacao, cotacao e proximo passo comercial.",
    pattern: /sem burocracia|aprovacao facil|sem an[aá]lise|sem perguntas/i
  }
];

const RISK_ORDER = {
  high: 3,
  medium: 2,
  low: 1
} as const;

export function containsSensitiveCompliancePattern(text: string) {
  return LOCAL_COMPLIANCE_RULES.some((rule) => rule.pattern.test(text));
}

export function reviewTextLocally(text: string): LocalComplianceReview {
  const reasons = LOCAL_COMPLIANCE_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => ({
    title: rule.title,
    detail: rule.detail,
    severity: rule.severity
  }));

  const suggestions = LOCAL_COMPLIANCE_RULES.filter((rule) => rule.pattern.test(text)).map(
    (rule) => rule.suggestion
  );

  if (reasons.length === 0) {
    return {
      riskLevel: "low",
      score: 92,
      reasons: [
        {
          title: "Sem alerta critico local",
          detail:
            "As regras locais nao encontraram promessa garantida, atributo sensivel ou segmentacao proibida evidente.",
          severity: "low"
        }
      ],
      suggestions: [
        "Mantenha a campanha focada em comparacao consultiva, empresa, regiao e proximo passo comercial."
      ],
      rewrittenText: text,
      disclaimer: DEFAULT_COMPLIANCE_DISCLAIMER,
      analysisSource: "local",
      aiWarning: ""
    };
  }

  const riskLevel = getRiskLevel(reasons);

  return {
    riskLevel,
    score: getScore(riskLevel, reasons.length),
    reasons,
    suggestions: dedupeStrings(suggestions),
    rewrittenText:
      "Compare alternativas de plano de saude empresarial para sua equipe com uma analise consultiva. Informe a cidade da empresa, quantidade aproximada de vidas e melhor contato para receber orientacao comercial.",
    disclaimer: DEFAULT_COMPLIANCE_DISCLAIMER,
    analysisSource: "local",
    aiWarning: ""
  };
}

function getRiskLevel(reasons: ComplianceReason[]): LocalComplianceReview["riskLevel"] {
  if (reasons.some((reason) => reason.severity === "high")) {
    return "high";
  }

  if (reasons.some((reason) => reason.severity === "medium")) {
    return "medium";
  }

  return "low";
}

function getScore(riskLevel: LocalComplianceReview["riskLevel"], reasonCount: number) {
  const baseScore = {
    high: 42,
    medium: 70,
    low: 94
  }[riskLevel];

  return Math.max(18, baseScore - Math.max(0, reasonCount - 1) * 5);
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function getHigherRiskLevel(
  left: LocalComplianceReview["riskLevel"],
  right: LocalComplianceReview["riskLevel"]
) {
  return RISK_ORDER[left] >= RISK_ORDER[right] ? left : right;
}
