/**
 * Gera uma imagem de preview por padrao de arte (AD_IMAGE_STYLE_PRESETS) usando a
 * OpenAI Images API e salva em public/creatives/presets/<id>.png.
 *
 * Uso: OPENAI_API_KEY=sk-... npm run creatives:previews
 * (se nao definida no ambiente, tenta ler de .env.local ou .env)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AD_IMAGE_STYLE_PRESETS } from "../src/lib/creatives/ad-image-presets";
import { buildAdImagePrompt } from "../src/lib/openai/prompt-playbooks";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

async function loadApiKey(): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  const projectRoot = process.cwd();
  for (const envFile of [".env.local", ".env"]) {
    try {
      const content = await readFile(path.join(projectRoot, envFile), "utf8");
      const match = content
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.startsWith("OPENAI_API_KEY="));
      if (match) {
        const value = match.slice("OPENAI_API_KEY=".length).replace(/^["']|["']$/g, "").trim();
        if (value) {
          return value;
        }
      }
    } catch {
      // arquivo nao existe, tenta o proximo
    }
  }

  throw new Error("OPENAI_API_KEY nao encontrada (ambiente, .env.local ou .env).");
}

async function generatePreview(apiKey: string, presetId: string, prompt: string) {
  const response = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: "1024x1024", n: 1 })
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: Array<{ b64_json?: string }>; error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(
      `Falha ao gerar preview "${presetId}" (HTTP ${response.status}): ${
        payload?.error?.message ?? "erro desconhecido"
      }`
    );
  }

  const b64 = payload?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`OpenAI nao retornou imagem para o preset "${presetId}".`);
  }

  return Buffer.from(b64, "base64");
}

async function main() {
  const apiKey = await loadApiKey();
  const outputDir = path.join(process.cwd(), "public", "creatives", "presets");
  await mkdir(outputDir, { recursive: true });

  for (const preset of AD_IMAGE_STYLE_PRESETS) {
    const prompt = buildAdImagePrompt({ ...preset.sample, stylePreset: preset.id });
    console.log(`Gerando preview: ${preset.id} ...`);
    const buffer = await generatePreview(apiKey, preset.id, prompt);
    const outputPath = path.join(outputDir, `${preset.id}.png`);
    await writeFile(outputPath, buffer);
    console.log(`  -> salvo em public/creatives/presets/${preset.id}.png`);
  }

  console.log("Previews gerados com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
