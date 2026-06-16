/**
 * Gera o preview de cada padrao de arte (AD_IMAGE_STYLE_PRESETS) e salva em
 * public/creatives/presets/<id>.png.
 *
 * Pipeline (mesma logica do app):
 *  1. A IA gera SOMENTE a foto/fundo (sem texto/logo) — so para estilos com
 *     `backgroundPrompt`. Estilos sem ele usam fundo em gradiente (custo zero).
 *  2. O compositor sobrepoe, com fonte real e o logo oficial (PNG), todo o
 *     texto/CTA/contato — sem typo e sem corte.
 *
 * Uso: OPENAI_API_KEY=sk-... npm run creatives:previews
 * (gera so alguns: npm run creatives:previews -- oferta-desconto familia)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  AD_IMAGE_STYLE_PRESETS,
  type AdImageStylePreset
} from "../src/lib/creatives/ad-image-presets";
import { getOperator } from "../src/lib/creatives/operator-config";
import { composeAdImage, COMPOSITOR_FORMATS } from "../src/lib/creatives/compositor";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
// Cache das fotos geradas pela IA. Permite reajustar os templates/banners sem
// gerar foto de novo (custo zero). Use `--fresh` para forcar nova foto.
const PHOTO_CACHE_DIR = path.join(process.cwd(), ".tmp", "preset-photos");
const FRESH = process.argv.includes("--fresh");

// Carrega a API key sob demanda (runs 100% em cache nao exigem key).
let apiKeyPromise: Promise<string> | null = null;
function getApiKey(): Promise<string> {
  apiKeyPromise ??= loadApiKey();
  return apiKeyPromise;
}

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

async function loadLogo(logoPath: string): Promise<Buffer | null> {
  const absolutePath = path.join(process.cwd(), "public", logoPath.replace(/^\/+/, ""));
  try {
    return await readFile(absolutePath);
  } catch {
    return null;
  }
}

/** Foto do cache, ou gera via IA e cacheia. Oferta (sem prompt) => null. */
async function resolveBackground(preset: AdImageStylePreset): Promise<Buffer | null> {
  if (!preset.backgroundPrompt) {
    return null;
  }

  const cacheFile = path.join(PHOTO_CACHE_DIR, `${preset.id}.png`);
  if (!FRESH) {
    try {
      return await readFile(cacheFile);
    } catch {
      // sem cache, gera abaixo
    }
  }

  const apiKey = await getApiKey();
  const buffer = await generateBackground(apiKey, preset.backgroundPrompt, preset.id);
  await mkdir(PHOTO_CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, buffer);
  return buffer;
}

/** Gera apenas a foto/fundo (sem texto/logo) via gpt-image-1. */
async function generateBackground(apiKey: string, prompt: string, presetId: string): Promise<Buffer> {
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
      `Falha ao gerar fundo "${presetId}" (HTTP ${response.status}): ${
        payload?.error?.message ?? "erro desconhecido"
      }`
    );
  }

  const b64 = payload?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`OpenAI nao retornou imagem para o fundo do preset "${presetId}".`);
  }

  return Buffer.from(b64, "base64");
}

async function buildPreview(preset: AdImageStylePreset): Promise<Buffer> {
  if (!preset.layout) {
    throw new Error(`Preset "${preset.id}" sem layout estruturado.`);
  }

  const operator = preset.carrierSlug ? getOperator(preset.carrierSlug) : undefined;
  const carrierColor = operator?.primaryColor ?? "#1F4ED8";
  const logo = operator ? await loadLogo(operator.logoPath) : null;

  const background = await resolveBackground(preset);

  return composeAdImage({
    styleId: preset.id,
    format: COMPOSITOR_FORMATS.preview,
    content: preset.layout,
    carrierColor,
    logo,
    background
  });
}

async function main() {
  const outputDir = path.join(process.cwd(), "public", "creatives", "presets");
  await mkdir(outputDir, { recursive: true });

  const only = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const presets = only.length
    ? AD_IMAGE_STYLE_PRESETS.filter((preset) => only.includes(preset.id))
    : AD_IMAGE_STYLE_PRESETS;

  if (only.length && presets.length === 0) {
    throw new Error(`Nenhum preset encontrado para: ${only.join(", ")}`);
  }

  for (const preset of presets) {
    const cached =
      Boolean(preset.backgroundPrompt) &&
      !FRESH &&
      existsSync(path.join(PHOTO_CACHE_DIR, `${preset.id}.png`));
    const mode = !preset.backgroundPrompt
      ? "gradiente + composicao"
      : cached
        ? "foto (cache) + composicao"
        : "foto IA + composicao";
    console.log(`Gerando preview: ${preset.id} (${mode}) ...`);
    const buffer = await buildPreview(preset);
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
