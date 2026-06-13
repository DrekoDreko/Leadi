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
      title: "Amil Ouro — Enfermaria e Apartamento",
      subtitle: "Qualidade, economia e conforto para sua empresa",
      briefing:
        "Arte destacando plano empresarial com rede credenciada de qualidade, cobertura completa e opções de enfermaria ou apartamento.",
      contractType: "PME",
      offer: "Invista no bem-estar da sua equipe",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora",
      style: "profissional, hospitalar, confiável"
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
      subtitle: "Cobertura completa — Regional e Nacional",
      briefing:
        "Arte para atrair famílias e empresas interessadas em plano de saúde, transmitindo proteção, segurança e rede de atendimento ampla.",
      contractType: "Familiar",
      offer: "Mais saúde, mais proteção e mais tranquilidade",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora",
      style: "acolhedor, familiar, confiável"
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
      "Elemento heroi: o VALOR ou PORCENTAGEM de desconto em tamanho gigante e peso forte (numero grande + 'R$' ou '%'), dominando a area central da arte; pode usar cor de destaque contrastante.",
      "Badge ou etiqueta com condicao especifica (ex: faixa etaria '44 a 48 anos', 'A partir de X vidas', tipo de contratacao).",
      "Acima ou abaixo do desconto, a chamada principal curta e impactante em tipografia forte; logo abaixo, a condicao comercial em fonte menor.",
      "Subtitulo ou slogan de apoio posicionado de forma complementar.",
      "Secao de diferenciais com icones (ex: atendimento especializado, prevencao e acompanhamento, rede propria).",
      "Logo oficial da operadora posicionado com destaque no topo ou canto superior da arte.",
      "CTA forte em botao/pilula com contorno (ex: 'Solicite sua cotacao', 'Fale comigo agora', 'Simule sem compromisso').",
      "Rodape com assinatura do corretor/marca e selo de WhatsApp (verde) com telefone em destaque.",
      "Paleta energetica e confiavel derivada da cor primaria da operadora; alto contraste; visual de anuncio promocional pronto para feed/story."
    ],
    sample: {
      title: "Saúde para quem faz a diferença",
      subtitle: "PME a partir de 2 vidas",
      briefing:
        "Arte promocional destacando valor acessível de plano de saúde para faixa etária 44-48 anos, com forte apelo ao preço.",
      contractType: "PME",
      discount: "R$ 810,73",
      offer: "A partir de R$ 810,73 por pessoa — 44 a 48 anos",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora",
      style: "promocional, vibrante, impactante"
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
