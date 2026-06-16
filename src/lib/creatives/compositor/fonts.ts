import { readFile } from "node:fs/promises";
import path from "node:path";

export type SatoriFont = {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
};

const FONT_WEIGHTS = [400, 600, 700, 800] as const;

let cache: SatoriFont[] | null = null;

/**
 * Carrega os pesos da Manrope (woff) embutidos no repo (assets/fonts/manrope).
 * satori converte o texto em vetor usando essas fontes, entao o resultado nao
 * depende de fontes instaladas no sistema — texto sempre identico, sem typo.
 */
export async function loadManropeFonts(): Promise<SatoriFont[]> {
  if (cache) {
    return cache;
  }

  const dir = path.join(process.cwd(), "assets", "fonts", "manrope");
  const fonts = await Promise.all(
    FONT_WEIGHTS.map(async (weight) => ({
      name: "Manrope",
      data: await readFile(path.join(dir, `manrope-${weight}.woff`)),
      weight,
      style: "normal" as const
    }))
  );

  cache = fonts;
  return fonts;
}
