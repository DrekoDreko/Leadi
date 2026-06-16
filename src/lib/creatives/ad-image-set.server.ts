import "server-only";

import { generateBackgroundPhoto, type OpenAIRequestOptions } from "@/lib/openai";
import {
  composeAdImage,
  COMPOSITOR_FORMATS,
  type AdLayoutContent,
  type CompositorFormat
} from "@/lib/creatives/compositor";

export type AdPlacementAsset = {
  placement: "feed" | "vertical";
  format: string;
  b64: string;
  mimeType: string;
  width: number;
  height: number;
};

export type AdImageSet = {
  feed: AdPlacementAsset;
  vertical: AdPlacementAsset;
  /** true quando a foto da IA falhou e a arte caiu para o fundo em gradiente. */
  photoSkipped: boolean;
};

export type AdImageSetInput = {
  styleId: string;
  content: AdLayoutContent;
  /** Cor primaria da operadora (hex). */
  carrierColor: string;
  /** Logo oficial da operadora (PNG). */
  logo?: Buffer | null;
  /** Brief da foto/fundo (sem texto/logo). Ausente => fundo em gradiente. */
  backgroundPrompt?: string | null;
};

/**
 * Gera o par de artes (Feed + Vertical) compondo texto/logo reais sobre a
 * foto/fundo da IA. A foto e gerada UMA vez e reaproveitada nos dois formatos
 * (recorte cover), economizando uma chamada de IA.
 */
export async function generateAdImageSet(
  input: AdImageSetInput,
  options: OpenAIRequestOptions
): Promise<AdImageSet> {
  let background: Buffer | null = null;
  let photoSkipped = false;

  if (input.backgroundPrompt) {
    try {
      background = await generateBackgroundPhoto(input.backgroundPrompt, "1024x1536", options);
    } catch (error) {
      // Plano B: sem credito/cota de IA (ou falha na foto) a arte ainda e
      // gerada com o fundo em gradiente da operadora — texto/logo nao usam IA.
      photoSkipped = true;
      console.warn(
        "[generateAdImageSet] foto da IA indisponivel, usando fundo em gradiente:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const feed = await composePlacement(input, COMPOSITOR_FORMATS.feed, "feed", background);
  const vertical = await composePlacement(input, COMPOSITOR_FORMATS.vertical, "vertical", background);

  return { feed, vertical, photoSkipped };
}

async function composePlacement(
  input: AdImageSetInput,
  format: CompositorFormat,
  placement: AdPlacementAsset["placement"],
  background: Buffer | null
): Promise<AdPlacementAsset> {
  const png = await composeAdImage({
    styleId: input.styleId,
    format,
    content: input.content,
    carrierColor: input.carrierColor,
    logo: input.logo ?? null,
    background
  });

  return {
    placement,
    format: format.id,
    b64: png.toString("base64"),
    mimeType: "image/png",
    width: format.width,
    height: format.height
  };
}
