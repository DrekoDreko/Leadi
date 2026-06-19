import type { SystemTemplate } from "@/lib/templates/types";
import { getWhatsAppSystemTemplatesFallback } from "@/lib/whatsapp/templates";

const campaignTemplatesFallback: SystemTemplate[] = [
  {
    id: "tpl-campaign-economia-pme",
    templateType: "campaign",
    category: "Economia PME",
    title: "Paga caro no plano individual? No empresarial economiza até 40%",
    description: "Quem já tem plano individual ou familiar pode migrar para o empresarial e pagar bem menos, mantendo a mesma rede nacional.",
    content: {
      audience: "Pessoas e famílias nas capitais do Nordeste (Salvador, Recife, Fortaleza e região) que pagam caro em plano individual ou familiar e querem reduzir o custo migrando para o empresarial.",
      offer: "Comparativo entre o plano individual atual e o empresarial PME equivalente, mostrando a economia (que pode chegar a cerca de 40%) com a mesma rede nacional e cobertura.",
      region: "Salvador, Recife, Fortaleza",
      differentiator: "Mostra quanto a pessoa economiza saindo do individual para o empresarial, mantendo a rede nacional para usar em qualquer lugar do Brasil.",
      tone: "Consultivo e direto",
      notes: "Não prometer percentual exato de economia; usar \"pode chegar a ~40%\" como referência. Reforçar que a rede nacional atende em todo o Brasil. Empresarial a partir de 2 vidas (Amil) ou 3 vidas (Bradesco, SulAmérica)."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-empresarial-cnpj",
    templateType: "campaign",
    category: "Empresarial",
    title: "Tem CNPJ? Plano empresarial a partir de 2 vidas",
    description: "Para empresário, MEI ou sócio com CNPJ ativo: cotação empresarial com preço menor que o individual.",
    content: {
      audience: "Empresários, MEIs e sócios com CNPJ ativo nas capitais do Nordeste que querem plano de saúde com preço empresarial para si, sócios e dependentes.",
      offer: "Cotação de plano empresarial PME por número de vidas e rede, comparando operadoras e mostrando a economia frente ao plano individual.",
      region: "Salvador, Recife, Fortaleza",
      differentiator: "Estrutura o plano pelo CNPJ já existente, incluindo sócios e dependentes, com preço empresarial e rede nacional.",
      tone: "Humano e claro",
      notes: "Empresarial a partir de 2 vidas (Amil) ou 3 vidas (Bradesco, SulAmérica). Não prometer aprovação automática; a elegibilidade depende da operadora e do tempo de CNPJ. Rede nacional atende em todo o Brasil."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-individual",
    templateType: "campaign",
    category: "Individual",
    title: "Quer um plano só para você ou sua família?",
    description: "Para quem prefere o plano individual ou familiar, sem abrir empresa. Compare operadoras e rede nacional.",
    content: {
      audience: "Pessoas e famílias do Nordeste que querem um plano individual ou familiar para si, sem abrir CNPJ.",
      offer: "Cotação de plano individual/familiar comparando operadoras, valores, carências e rede nacional credenciada na cidade do lead.",
      region: "Salvador, Recife, Fortaleza",
      differentiator: "Atende quem prefere o individual, comparando operadoras e mostrando a rede nacional disponível para usar em todo o Brasil.",
      tone: "Educativo e simples",
      notes: "Não empurrar o empresarial; respeitar quem quer individual. Pode mencionar que o empresarial costuma ser mais barato caso o lead tenha interesse. Rede nacional atende em todo o Brasil."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

export const systemTemplatesFallback: SystemTemplate[] = [
  ...campaignTemplatesFallback,
  ...getWhatsAppSystemTemplatesFallback()
];
