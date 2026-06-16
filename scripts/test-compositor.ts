/**
 * Teste OFFLINE do compositor (sem chamar a OpenAI). Usa fotos existentes como
 * fundo provisorio so para validar a composicao (layout, fonte, logo, faixas).
 * Saida: public/creatives/presets/_test_<id>.png
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { composeAdImage, COMPOSITOR_FORMATS, type AdLayoutContent } from "../src/lib/creatives/compositor";

const ROOT = process.cwd();

async function readOptional(rel: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(ROOT, rel));
  } catch {
    return null;
  }
}

type Case = {
  id: string;
  carrierColor: string;
  logo: string;
  background?: string;
  content: AdLayoutContent;
};

const CASES: Case[] = [
  {
    id: "oferta-desconto",
    carrierColor: "#003366",
    logo: "public/creatives/logos/operadoras/amil.png",
    content: {
      title: "Amil Ouro — Saúde de qualidade",
      subtitle: "Plano empresarial com o melhor custo-benefício",
      contractType: "PME a partir de 2 vidas",
      discount: "até 40%",
      differentials: ["Cobertura nacional", "Rede de clínicas", "Atendimento de urgência"],
      cta: "Solicite sua cotação",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora"
    }
  },
  {
    id: "medico-hospital",
    carrierColor: "#CC092F",
    logo: "public/creatives/logos/operadoras/bradesco-saude.png",
    background: ".tmp/preset-photos/medico-hospital.png",
    content: {
      title: "Qualidade para sua empresa",
      contractType: "PME a partir de 3 vidas",
      benefits: [
        { title: "Rede credenciada de qualidade" },
        { title: "Cobertura completa", detail: "Consultas, exames e internações" },
        { title: "Opção de enfermaria ou apartamento" },
        { title: "Programas de saúde e prevenção" }
      ],
      cta: "Solicite uma cotação agora",
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora"
    }
  },
  {
    id: "familia",
    carrierColor: "#F27A1A",
    logo: "public/creatives/logos/operadoras/sulamerica.png",
    background: ".tmp/preset-photos/familia.png",
    content: {
      title: "Cuidado de verdade para sua família e sua empresa",
      subtitle: "Cobertura Completa — Regional e Nacional",
      columns: [
        {
          heading: "Para sua família",
          items: ["Segurança em todas as fases", "Rede hospitalar de confiança", "Atendimento de qualidade"]
        },
        {
          heading: "Para empresas",
          items: ["Benefício valorizado", "Mais produtividade", "Planos a partir de 3 vidas"]
        }
      ],
      phone: "(00) 00000-0000",
      brandName: "Sua Corretora"
    }
  }
];

const FORMATS = [
  COMPOSITOR_FORMATS.preview,
  COMPOSITOR_FORMATS.feed,
  COMPOSITOR_FORMATS.vertical
];

async function main() {
  for (const item of CASES) {
    const logo = await readOptional(item.logo);
    const background = item.background ? await readOptional(item.background) : null;

    for (const format of FORMATS) {
      const png = await composeAdImage({
        styleId: item.id,
        format,
        content: item.content,
        carrierColor: item.carrierColor,
        logo,
        background
      });

      const out = path.join(ROOT, "public", "creatives", "presets", `_test_${item.id}_${format.id}.png`);
      await writeFile(out, png);
      console.log(`-> ${out}`);
    }

    // Plano B: render sem foto (fundo em gradiente) para estilos com background.
    if (item.background) {
      const fallback = await composeAdImage({
        styleId: item.id,
        format: COMPOSITOR_FORMATS.preview,
        content: item.content,
        carrierColor: item.carrierColor,
        logo,
        background: null
      });
      const out = path.join(ROOT, "public", "creatives", "presets", `_test_${item.id}_nobg.png`);
      await writeFile(out, fallback);
      console.log(`-> ${out}`);
    }
  }
  console.log("Compositor OK.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
