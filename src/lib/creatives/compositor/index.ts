import { renderNodeToPng, backgroundToDataUri, prepareLogo, prepareCutout } from "./render";
import { renderTemplateNode } from "./templates";
import type { ComposeAdInput, CompositorFormat } from "./types";

export * from "./types";

/** Estilos em que a "foto" e um recorte transparente, nao um fundo cortado. */
export function usesCutout(styleId: string): boolean {
  return styleId === "recorte-impacto";
}

function logoHeightFor(styleId: string): number {
  if (styleId === "oferta-desconto") {
    // Logo um pouco maior no oferta (centralizado em destaque).
    return 78;
  }
  if (styleId === "recorte-impacto") {
    // Marca da operadora e o primeiro elemento da leitura neste estilo.
    return 104;
  }
  return 64;
}

/**
 * Caixa do recorte: alto o bastante para a pessoa dominar a arte, estreito o
 * bastante para nao invadir a coluna de texto da esquerda.
 */
function cutoutBoxFor(format: CompositorFormat) {
  const isVertical = format.height / format.width >= 1.6;
  // No 9:16 a arte e estreita: a pessoa encolhe para nao invadir a coluna de
  // texto, que ali precisa de mais largura por causa das faixas de seguranca.
  return {
    maxWidth: Math.round(format.width * (isVertical ? 0.46 : 0.56)),
    maxHeight: Math.round(format.height * (isVertical ? 0.46 : 0.66))
  };
}

/**
 * Monta a arte final: a IA entrega so a foto/fundo; aqui sobrepomos, com fonte
 * real e logo oficial, todo o texto/CTA/contato — sem typo e sem corte.
 */
export async function composeAdImage(input: ComposeAdInput): Promise<Buffer> {
  const logo = input.logo ? await prepareLogo(input.logo, logoHeightFor(input.styleId)) : null;
  const backgroundUri = input.background
    ? await backgroundToDataUri(input.background, input.format)
    : null;
  const cutout = input.cutout
    ? await prepareCutout(input.cutout, cutoutBoxFor(input.format))
    : null;

  const node = renderTemplateNode({
    styleId: input.styleId,
    format: input.format,
    content: input.content,
    carrierColor: input.carrierColor,
    logo,
    backgroundUri,
    cutout
  });

  return renderNodeToPng(node, input.format);
}
