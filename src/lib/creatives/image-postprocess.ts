import "server-only";

import sharp from "sharp";

import type { AdPlacementDimensions } from "@/lib/creatives/ad-creative-specs";

export async function cropImageToExactDimensions(
  input: Buffer,
  { width, height }: AdPlacementDimensions
): Promise<Buffer> {
  return sharp(input)
    .resize(width, height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

export async function cropBase64ToExactDimensions(
  base64: string,
  dimensions: AdPlacementDimensions
): Promise<string> {
  const cropped = await cropImageToExactDimensions(
    Buffer.from(base64, "base64"),
    dimensions
  );

  return cropped.toString("base64");
}
