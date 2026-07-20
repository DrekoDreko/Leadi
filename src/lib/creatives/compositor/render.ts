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
 * Prepara o recorte da pessoa: apara o transparente em volta (trim no alfa) e
 * encaixa dentro da caixa alvo mantendo proporcao. Sem o trim, a margem vazia
 * que a IA deixa em volta do sujeito empurraria a pessoa para fora da arte.
 */
export async function prepareCutout(
  buffer: Buffer,
  box: { maxWidth: number; maxHeight: number }
): Promise<PreparedLogo> {
  let base = sharp(buffer).ensureAlpha();

  try {
    // threshold alto: ignora o "halo" semitransparente das bordas do recorte.
    base = sharp(await base.trim({ threshold: 12 }).png().toBuffer());
  } catch {
    // imagem sem area aparavel (fundo opaco): segue com a original.
    base = sharp(buffer).ensureAlpha();
  }

  const resized = await base
    .resize({
      width: Math.round(box.maxWidth),
      height: Math.round(box.maxHeight),
      fit: "inside",
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  return {
    src: `data:image/png;base64,${resized.toString("base64")}`,
    width: meta.width ?? Math.round(box.maxWidth),
    height: meta.height ?? Math.round(box.maxHeight)
  };
}

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
