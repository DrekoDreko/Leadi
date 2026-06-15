export type AdPlacementSafeZone = {
  top: number;
  bottom: number;
  sides: number;
};

export type AdPlacementTextLimits = {
  primaryMax: number;
  headlineMax: number;
};

export type AdPlacementDimensions = {
  width: number;
  height: number;
};

export type AdPlacementSpec = {
  id: "feed" | "stories" | "reels";
  label: string;
  platform: "meta";
  aspectRatioLabel: string;
  recommendedSize: string;
  targetDimensions: AdPlacementDimensions;
  safeZone: AdPlacementSafeZone;
  textLimits: AdPlacementTextLimits;
  promptDirectives: string[];
};

export const AD_PLACEMENT_SPECS: AdPlacementSpec[] = [
  {
    id: "feed",
    label: "Feed (Facebook/Instagram)",
    platform: "meta",
    aspectRatioLabel: "1:1 a 4:5 (vertical preferido)",
    recommendedSize: "1080x1080 (1:1) ou 1080x1350 (4:5)",
    targetDimensions: { width: 1080, height: 1350 },
    safeZone: { top: 10, bottom: 10, sides: 10 },
    textLimits: { primaryMax: 150, headlineMax: 27 },
    promptDirectives: [
      "Composicao para Feed do Facebook/Instagram em proporcao quadrada (1:1) ou vertical (4:5) — priorize o enquadramento vertical, que ocupa mais tela no mobile.",
      "Mantenha uma margem segura de ~10% em todas as bordas, sem texto ou logo colado nos cantos.",
      "Titulo/chamada curto e direto (ate ~27 caracteres) e texto de apoio enxuto; evite paredes de texto sobre a imagem.",
      "Imagem nitida e envolvente, com foco claro no produto/beneficio e respiro entre os elementos."
    ]
  },
  {
    id: "stories",
    label: "Stories (Instagram/Facebook)",
    platform: "meta",
    aspectRatioLabel: "9:16 (tela cheia vertical)",
    recommendedSize: "1080x1920",
    targetDimensions: { width: 1080, height: 1920 },
    safeZone: { top: 14, bottom: 20, sides: 6 },
    textLimits: { primaryMax: 40, headlineMax: 55 },
    promptDirectives: [
      "Composicao vertical 9:16 em tela cheia, pensada para mobile.",
      "Mantenha o topo ~14% (cerca de 250px) e o rodape ~20% (cerca de 340px) da arte LIVRES de texto, logo e CTA — essas areas sao cobertas pelo icone do perfil e pelo botao de chamada para acao.",
      "Concentre a mensagem principal no terco central da arte, com texto curto, peso forte e alto contraste.",
      "Devido ao tamanho reduzido na tela, prefira pouco texto e um unico foco visual claro."
    ]
  },
  {
    id: "reels",
    label: "Reels (Instagram/Facebook)",
    platform: "meta",
    aspectRatioLabel: "9:16 (tela cheia vertical)",
    recommendedSize: "1080x1920",
    targetDimensions: { width: 1080, height: 1920 },
    safeZone: { top: 14, bottom: 35, sides: 6 },
    textLimits: { primaryMax: 40, headlineMax: 55 },
    promptDirectives: [
      "Composicao vertical 9:16 em tela cheia, imersiva e nativa para Reels.",
      "Mantenha o topo ~14%, o rodape ~35% e ~6% de cada lateral LIVRES de texto, logo e CTA — essas faixas sao cobertas pela interface do Reels (legenda, perfil, botoes de acao a direita).",
      "Posicione a mensagem principal no centro/terco superior-central, fora das faixas de seguranca, com texto curto e alto contraste.",
      "Evite elementos importantes nas bordas; deixe respiro generoso na parte inferior."
    ]
  }
];

export function getAdPlacementSpec(id?: string | null): AdPlacementSpec | undefined {
  if (!id) {
    return undefined;
  }

  return AD_PLACEMENT_SPECS.find((spec) => spec.id === id);
}

const FORMAT_TO_PLACEMENT_ID: Record<string, AdPlacementSpec["id"]> = {
  story: "stories",
  stories: "stories",
  reels: "reels",
  reel: "reels",
  feed: "feed",
  square: "feed",
  portrait: "feed",
  landscape: "feed"
};

export function resolvePlacementFromFormat(
  format?: string | null
): AdPlacementSpec | undefined {
  if (!format) {
    return undefined;
  }

  const placementId = FORMAT_TO_PLACEMENT_ID[format.trim().toLowerCase()];
  return placementId ? getAdPlacementSpec(placementId) : undefined;
}
