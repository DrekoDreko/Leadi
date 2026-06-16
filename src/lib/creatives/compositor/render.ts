import satori from "satori";
import sharp from "sharp";
import { loadManropeFonts } from "./fonts";
import type { SatoriNode } from "./h";
import type { CompositorFormat } from "./types";

/** Renderiza a arvore satori -> SVG (texto em vetor) -> PNG via sharp. */
export async function renderNodeToPng(
  node: SatoriNode,
  format: CompositorFormat
): Promise<Buffer> {
  const fonts = await loadManropeFonts();
  const svg = await satori(node as unknown as Parameters<typeof satori>[0], {
    width: format.width,
    height: format.height,
    fonts
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Recorta (cover) o fundo para as dimensoes exatas e devolve como data URI. */
export async function backgroundToDataUri(
  buffer: Buffer,
  format: CompositorFormat
): Promise<string> {
  const png = await sharp(buffer)
    .resize(format.width, format.height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  return `data:image/png;base64,${png.toString("base64")}`;
}

export type PreparedLogo = {
  src: string;
  width: number;
  height: number;
};

/**
 * Redimensiona o logo para uma altura alvo (mantendo proporcao) e devolve o
 * data URI + dimensoes reais (satori exige width/height em <img>).
 */
export async function prepareLogo(
  buffer: Buffer,
  targetHeight: number
): Promise<PreparedLogo> {
  const resized = await sharp(buffer)
    .resize({ height: targetHeight, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  return {
    src: `data:image/png;base64,${resized.toString("base64")}`,
    width: meta.width ?? targetHeight,
    height: meta.height ?? targetHeight
  };
}
