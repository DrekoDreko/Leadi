import type { AdLayoutContent } from "./compositor/types";

export type AdImageStylePresetSample = {
  title: string;
  subtitle?: string;
  objective?: string;
  briefing: string;
  carrier?: string;
  contractType?: string;
  discount?: string;
  offer?: string;
  phone?: string;
  brandName?: string;
  style?: string;
};

export type AdImageStylePreset = {
  id: string;
  label: string;
  description: string;
  previewImage: string;
  promptSpec: string[];
  sample: AdImageStylePresetSample;
  /** Slug da operadora usada no preview (resolve cor + logo). */
  carrierSlug?: string;
  /**
   * Brief da FOTO/fundo que a IA gera (sem texto/logo). Ausente => fundo
   * gerado por gradiente da cor da operadora (sem custo de IA).
   */
  backgroundPrompt?: string;
  /** Conteudo estruturado que o compositor desenha (texto/logo reais). */
  layout?: AdLayoutContent;
};

export const AD_IMAGE_STYLE_PRESETS: AdImageStylePreset[] = [
  {
    id: "medico-hospital",
    label: "Estilo Médico / Hospital",
    description:
      "Médico atendendo paciente ou ambiente hospitalar. Transmite profissionalismo, confiança e excelência médica.",
    previewImage: "/creatives/presets/medico-hospital.png",
    promptSpec: [
      "Composicao profissional de saude: foto realista de medico(a) brasileiro(a) de jaleco branco atendendo ou interagindo com paciente/casal sorridente, em ambiente hospitalar moderno e acolhedor.",
      "Bloco de informacao lateral ou inferior com icones de check/shield listando beneficios (ex: rede credenciada de qualidade, cobertura completa, opcao enfermaria ou apartamento, programas de prevencao).",
      "Chamada principal em tipografia sans-serif pesada e bem legivel, posicionada no topo ou sobre bloco de cor solida derivado da cor primaria da operadora.",
      "Subtitulo ou frase de apoio abaixo do titulo em tamanho menor, complementando a mensagem.",
      "Logo oficial da operadora posicionado com destaque no topo ou canto superior da arte.",
      "Rodape com assinatura do corretor/marca e selo de WhatsApp (verde) com telefone em destaque.",
      "Paleta profissional e confiavel derivada da cor primaria da operadora; cantos arredondados; sombras suaves; alto contraste texto/fundo.",
      "Clima: confianca, excelencia medica, cuidado profissional, rede hospitalar de qualidade. Visual de anuncio profissional pronto para feed/story."
    ],
    sample: {
      title: "Bradesco Saúde — Qualidade para sua empresa",
      subtitle: "PME a partir de 3 vidas",
      briefing:
        "Arte destacando plano de saúde empresarial com rede credenciada de qualidade, cobertura completa (consultas, exames e internações), opção de enfermaria ou apartamento e programas de saúde e prevenção.",
      carrier: "Bradesco Saúde",
      contractType: "PME",
      offer: "Solicite uma cotação agora",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora",
      style: "profissional, hospitalar, confiável"
    },
    carrierSlug: "bradesco-saude",
    backgroundPrompt:
      "Foto realista e profissional de banco de imagens de saude, PLANO ABERTO / wide shot: medica brasileira de jaleco branco com estetoscopio, sorrindo e conversando com um casal (cliente) em consultorio ou hospital moderno, claro e acolhedor. As pessoas aparecem em tamanho MENOR, ocupando a faixa central, com BASTANTE espaco livre acima das cabecas e abaixo. Rostos e cabecas COMPLETOS, com folga, nunca cortados nas bordas. Iluminacao natural suave, tons claros. SEM nenhum texto, SEM letras, SEM logotipo, SEM numeros, SEM marca d'agua, SEM bordas.",
    layout: {
      title: "Qualidade para sua empresa",
      contractType: "PME a partir de 3 vidas",
      benefits: [
        { title: "Rede credenciada de qualidade" },
        { title: "Cobertura completa", detail: "Consultas, exames e internações" },
        { title: "Programas de saúde e prevenção" }
      ],
      cta: "Solicite uma cotação agora",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora"
    }
  },
  {
    id: "familia",
    label: "Estilo Família",
    description:
      "Família feliz e unida. Acolhedor, transmitindo proteção, segurança e tranquilidade.",
    previewImage: "/creatives/presets/familia.png",
    promptSpec: [
      "Composicao acolhedora: foto realista e calorosa de uma familia brasileira (pais e filhos, ou casal com crianca) se abracando e sorrindo, ocupando boa parte da arte.",
      "Painel/bloco de cor solida ou gradiente suave derivado da cor primaria da operadora, ancorado em um lado ou no topo, com a chamada principal em tipografia sans-serif pesada e peso misto (parte da frase em destaque).",
      "Subtitulo ou frase de apoio posicionada abaixo do titulo principal.",
      "Secao de beneficios dividida em dois blocos (ex: 'Para sua familia' e 'Para empresas') com icones e listas de vantagens (seguranca, rede hospitalar, atendimento de qualidade, planos a partir de X vidas).",
      "Logo oficial da operadora posicionado com destaque no topo da arte.",
      "Rodape elegante com assinatura do corretor/marca, selo de WhatsApp (verde) com telefone em destaque, e selo ANS discreto.",
      "Paleta acolhedora e confiavel derivada da cor primaria da operadora; cantos arredondados; sombras suaves; alto contraste texto/fundo.",
      "Clima: protecao, familia, cuidado, confianca, tranquilidade. Visual de anuncio profissional limpo, pronto para feed/story."
    ],
    sample: {
      title: "Cuidado de verdade para sua família e sua empresa",
      subtitle: "Cobertura Completa — Regional e Nacional",
      briefing:
        "Arte para atrair famílias e empresas, dividindo os benefícios em dois blocos: 'Para sua família' (segurança em todas as fases da vida, rede hospitalar de confiança, atendimento de qualidade) e 'Para empresas' (benefício valorizado, mais produtividade, planos a partir de 3 vidas).",
      carrier: "SulAmérica",
      contractType: "Familiar",
      offer: "Mais saúde, mais proteção e mais tranquilidade",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora",
      style: "acolhedor, familiar, confiável"
    },
    carrierSlug: "sulamerica",
    backgroundPrompt:
      "Foto realista e calorosa de banco de imagens, PLANO ABERTO / wide shot: familia brasileira feliz (pai, mae e dois filhos) se abracando e sorrindo, ao ar livre, luz natural suave, clima de protecao e carinho. A familia aparece em tamanho MENOR, ocupando a faixa central da imagem, com BASTANTE espaco livre (fundo desfocado) acima das cabecas e abaixo. Rostos e cabecas COMPLETOS, com folga, nunca cortados nas bordas. SEM nenhum texto, SEM letras, SEM logotipo, SEM numeros, SEM marca d'agua, SEM bordas.",
    layout: {
      title: "Cuidado de verdade para sua família e sua empresa",
      subtitle: "Cobertura Completa — Regional e Nacional",
      columns: [
        {
          heading: "Para sua família",
          items: ["Segurança em todas as fases", "Rede hospitalar de confiança", "Atendimento de qualidade"]
        },
        {
          heading: "Para empresas",
          items: ["Benefício valorizado", "Mais produtividade", "Planos a partir de 3 vidas"]
        }
      ],
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora"
    }
  },
  {
    id: "oferta-desconto",
    label: "Estilo Oferta / Desconto",
    description:
      "Foco em promoção e preço. Desconto ou valor em destaque com visual impactante e comercial.",
    previewImage: "/creatives/presets/oferta-desconto.png",
    promptSpec: [
      "Composicao promocional impactante: fundo com gradiente vibrante ou foto de fundo sutil derivado da cor primaria da operadora.",
      "Elemento heroi: a PORCENTAGEM de desconto em tamanho gigante e peso forte (numero grande + '%', ex: '40%'), dominando a area central da arte; use cor de destaque contrastante. O desconto e sempre expresso em porcentagem, com teto de ate 40% (nunca exiba percentual acima de 40%).",
      "Badge ou etiqueta com condicao especifica (ex: 'PME a partir de 2 vidas', 'A partir de X vidas', tipo de contratacao).",
      "Acima ou abaixo do desconto, a chamada principal curta e impactante em tipografia forte; logo abaixo, a condicao comercial em fonte menor.",
      "Subtitulo ou slogan de apoio posicionado de forma complementar.",
      "Secao de diferenciais com icones (ex: atendimento especializado, prevencao e acompanhamento, rede propria).",
      "Logo oficial da operadora posicionado com destaque no topo ou canto superior da arte.",
      "CTA forte em botao/pilula com contorno (ex: 'Solicite sua cotacao', 'Fale comigo agora', 'Simule sem compromisso').",
      "Rodape com assinatura do corretor/marca e selo de WhatsApp (verde) com telefone em destaque.",
      "Paleta energetica e confiavel derivada da cor primaria da operadora; alto contraste; visual de anuncio promocional pronto para feed/story."
    ],
    sample: {
      title: "Amil Ouro — Saúde de qualidade",
      subtitle: "Plano empresarial com o melhor custo-benefício",
      briefing:
        "Arte promocional destacando desconto em porcentagem para plano de saúde empresarial, com forte apelo ao percentual de economia. O desconto é sempre em porcentagem, até 40%.",
      carrier: "Amil",
      contractType: "PME a partir de 2 vidas",
      discount: "até 40%",
      offer: "Até 40% de desconto por pessoa/mês",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora",
      style: "promocional, vibrante, impactante"
    },
    carrierSlug: "amil",
    // Sem backgroundPrompt: fundo em gradiente da cor da operadora (sem custo de IA).
    layout: {
      title: "Amil Ouro — Saúde de qualidade",
      subtitle: "Plano empresarial com o melhor custo-benefício",
      contractType: "PME a partir de 2 vidas",
      discount: "até 40%",
      differentials: ["Cobertura nacional", "Rede de clínicas", "Atendimento de urgência"],
      cta: "Solicite sua cotação",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora"
    }
  }
];

export function getAdImageStylePreset(id?: string | null) {
  if (!id) {
    return undefined;
  }

  return AD_IMAGE_STYLE_PRESETS.find((preset) => preset.id === id);
}

export function isAdImageStylePresetId(id?: string | null): boolean {
  return Boolean(getAdImageStylePreset(id));
}
