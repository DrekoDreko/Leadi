// Modulo client-safe (sem "server-only"): usado pelo client da pagina, pela rota
// de geracao e pelo script de previews. Define os "padroes de arte" reutilizaveis,
// com o DNA visual derivado de anuncios reais de plano de saude, porem sempre com
// marcas/logos GENERICOS (nunca reproduzindo operadoras concorrentes reais).

export type AdImageStylePresetSample = {
  title: string;
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
    id: "familia-bloco",
    label: "Família + bloco colorido",
    description:
      "Foto de família feliz, bloco de cor sólida com a chamada em destaque, faixa de selos genéricos e selo de WhatsApp no rodapé.",
    previewImage: "/creatives/presets/familia-bloco.png",
    promptSpec: [
      "Composicao em camadas: foto realista e calorosa de uma familia brasileira (pais e filhos) se abracando e sorrindo, ocupando boa parte da arte.",
      "Painel/bloco de cor solida (vinho escuro, azul-marinho ou verde) ancorado em um lado ou no topo, com a chamada principal em tipografia sans-serif pesada, peso misto (parte da frase em destaque), bem legivel e com bom respiro.",
      "Pequena pilula/etiqueta de apoio acima ou abaixo do titulo (ex.: 'para toda a familia' ou 'peca seu orcamento') em cor de contraste suave.",
      "Opcional: um cartao branco arredondado com uma GRADE de selos GENERICOS de operadoras (logotipos ficticios, formas neutras — nunca marcas reais), organizados em 2-3 colunas.",
      "Rodape com assinatura elegante do consultor/marca e um selo branco arredondado com icone de WhatsApp (verde) e o telefone em destaque.",
      "Paleta acolhedora e confiavel; cantos arredondados; sombras suaves; alto contraste texto/fundo.",
      "Clima: protecao, familia, cuidado, confianca. Visual de anuncio profissional, limpo, pronto para feed."
    ],
    sample: {
      title: "Plano de saúde para sua família",
      briefing:
        "Arte para atrair famílias interessadas em plano de saúde, transmitindo proteção e cuidado.",
      contractType: "Familiar",
      offer: "Atendimento humanizado e rede credenciada ampla",
      phone: "(81) 98704-7809",
      brandName: "Consultoria Saúde+",
      style: "acolhedor, familiar, confiável"
    }
  },
  {
    id: "oferta-desconto",
    label: "Oferta / Desconto",
    description:
      "Fundo gradiente vibrante com a porcentagem de desconto gigante como herói, logo genérico, condição comercial e selo de contato.",
    previewImage: "/creatives/presets/oferta-desconto.png",
    promptSpec: [
      "Composicao promocional: fundo com gradiente azul vibrante e molduras/cantos arredondados decorativos (linhas finas formando quadros nos cantos).",
      "Elemento heroi: a PORCENTAGEM de desconto em tamanho gigante e peso forte (numero + '%'), dominando o centro/inferior da arte; pode usar cor de destaque (amarelo ou branco).",
      "Acima do desconto, a chamada principal curta e impactante (peso misto); logo abaixo, a condicao comercial em fonte menor (ex.: 'nas primeiras parcelas' ou 'utilize seu CNPJ e reduza ate X%').",
      "Cartao/badge escuro arredondado contendo a condicao detalhada, e um pequeno texto de validade quando houver.",
      "Logotipo GENERICO de operadora no topo ou rodape (marca ficticia — nunca operadoras reais).",
      "Botao/pilula de CTA com contorno (ex.: 'Solicite um estudo comparativo' ou 'Faca uma cotacao') e selo arredondado de contato com icone de WhatsApp (verde) e telefone visivel.",
      "Opcional: foto de familia ou pessoa sorrindo integrada ao fundo, sem competir com o desconto.",
      "Paleta energetica e confiavel; alto contraste; visual de anuncio promocional pronto para feed/story."
    ],
    sample: {
      title: "Saúde em primeiro lugar",
      briefing:
        "Arte promocional destacando desconto em plano de saúde, com forte apelo à oferta.",
      discount: "20%",
      offer: "20% de desconto nas 3 primeiras parcelas",
      contractType: "Familiar",
      phone: "(81) 98704-7809",
      brandName: "Consultoria Saúde+",
      style: "promocional, vibrante, azul"
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
