import { renderNodeToPng, backgroundToDataUri, prepareLogo } from "./render";
import { renderTemplateNode } from "./templates";
import type { ComposeAdInput } from "./types";

export * from "./types";

function logoHeightFor(styleId: string): number {
  // Logo um pouco maior no oferta (centralizado em destaque).
  return styleId === "oferta-desconto" ? 78 : 64;
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

  const node = renderTemplateNode({
    styleId: input.styleId,
    content: input.content,
    carrierColor: input.carrierColor,
    logo,
    backgroundUri
  });

  return renderNodeToPng(node, input.format);
}
