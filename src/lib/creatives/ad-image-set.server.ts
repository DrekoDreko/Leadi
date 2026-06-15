import "server-only";

import {
  generateAdImage,
  type AdImageInput,
  type AdImageSize,
  type OpenAIRequestOptions
} from "@/lib/openai";
import {
  getAdPlacementSpec,
  type AdPlacementSpec
} from "@/lib/creatives/ad-creative-specs";
import { cropBase64ToExactDimensions } from "@/lib/creatives/image-postprocess";

// gpt-image-1 nao gera 4:5 nem 9:16 nativos. Geramos no formato mais alto
// disponivel (2:3) e recortamos (crop-cover) para as dimensoes exatas de cada
// posicionamento. O corte cai nas faixas ja reservadas pelas zonas de seguranca.
const GENERATION_SIZE: AdImageSize = "1024x1536";

export type AdPlacementAsset = {
  placement: "feed" | "vertical";
  placementSpecId: AdPlacementSpec["id"];
  format: string;
  b64: string;
  mimeType: string;
  width: number;
  height: number;
};

export type AdImageSet = {
  feed: AdPlacementAsset;
  vertical: AdPlacementAsset;
};

type AdImageSetBaseInput = Omit<AdImageInput, "size" | "format">;

export async function generateAdImageSet(
  input: AdImageSetBaseInput,
  options: OpenAIRequestOptions
): Promise<AdImageSet> {
  const feed = await generatePlacementAsset(input, "feed", "feed", options);
  const vertical = await generatePlacementAsset(input, "stories", "vertical", options);

  return { feed, vertical };
}

async function generatePlacementAsset(
  input: AdImageSetBaseInput,
  format: string,
  placement: AdPlacementAsset["placement"],
  options: OpenAIRequestOptions
): Promise<AdPlacementAsset> {
  const spec = getAdPlacementSpec(format === "feed" ? "feed" : "stories");

  if (!spec) {
    throw new Error(`Spec de posicionamento nao encontrado para o formato ${format}.`);
  }

  const generated = await generateAdImage(
    { ...input, format, size: GENERATION_SIZE },
    options
  );

  const croppedB64 = await cropBase64ToExactDimensions(
    generated.b64,
    spec.targetDimensions
  );

  return {
    placement,
    placementSpecId: spec.id,
    format,
    b64: croppedB64,
    mimeType: "image/png",
    width: spec.targetDimensions.width,
    height: spec.targetDimensions.height
  };
}
