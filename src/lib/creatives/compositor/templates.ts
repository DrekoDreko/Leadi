import { h, type SatoriNode } from "./h";
import { shade } from "./colors";
import type { AdBenefit, AdColumn, AdLayoutContent, CompositorFormat } from "./types";
import type { PreparedLogo } from "./render";

export type TemplateInput = {
  styleId: string;
  format: CompositorFormat;
  content: AdLayoutContent;
  carrierColor: string;
  logo: PreparedLogo | null;
  backgroundUri: string | null;
  /** Recorte da pessoa (PNG transparente) ja aparado e dimensionado. */
  cutout: PreparedLogo | null;
};

const WHITE = "#FFFFFF";

/**
 * Corpo de texto encolhe conforme cresce: frase curta vira manchete grande,
 * frase longa cai para um tamanho que ainda cabe na coluna. Sem isso, "Possui
 * CNPJ?" saia no mesmo corpo de uma frase de 60 caracteres e parecia perdido.
 */
function fitFontSize(
  text: string,
  range: { max: number; min: number; charsAtMax: number; charsAtMin: number }
): number {
  const len = text.trim().length;
  if (len <= range.charsAtMax) {
    return range.max;
  }
  if (len >= range.charsAtMin) {
    return range.min;
  }
  const ratio = (len - range.charsAtMax) / (range.charsAtMin - range.charsAtMax);
  return Math.round(range.max - ratio * (range.max - range.min));
}

/** Largura media de um caractere em caixa alta na Manrope 800, por "em". */
const UPPERCASE_EM = 0.68;

/**
 * Corpo da manchete considerando TAMBEM a largura da coluna: satori nao quebra
 * dentro da palavra, entao uma palavra longa vazaria por cima do recorte se o
 * tamanho fosse escolhido so pela contagem de caracteres.
 */
function fitHeadline(text: string, boxWidth: number, range: { max: number; min: number }): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const longest = words.reduce((acc, word) => Math.max(acc, word.length), 1);
  const byWidth = boxWidth / (longest * UPPERCASE_EM);
  const byLength = fitFontSize(text, {
    max: range.max,
    min: range.min,
    charsAtMax: 13,
    charsAtMin: 62
  });

  return Math.round(Math.max(range.min * 0.72, Math.min(range.max, byWidth, byLength)));
}

/** Deriva colunas (sem heading) a partir de uma lista simples de beneficios. */
function splitBenefitsToColumns(benefits?: AdBenefit[]): AdColumn[] {
  const items = (benefits ?? []).map((b) => b.title).filter(Boolean);
  if (items.length === 0) {
    return [];
  }
  if (items.length <= 3) {
    return [{ heading: "", items }];
  }
  const mid = Math.ceil(items.length / 2);
  return [
    { heading: "", items: items.slice(0, mid) },
    { heading: "", items: items.slice(mid) }
  ];
}

/* ------------------------------- icones --------------------------------- */

function checkBadge(size: number, bg: string, fg: string): SatoriNode {
  const inner = Math.round(size * 0.6);
  return h(
    "div",
    {
      style: {
        display: "flex",
        width: size,
        height: size,
        borderRadius: 999,
        background: bg,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    },
    h(
      "svg",
      { width: inner, height: inner, viewBox: "0 0 24 24", fill: "none" },
      h("path", {
        d: "M20 6L9 17l-5-5",
        stroke: fg,
        "stroke-width": 3.5,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    )
  );
}

function whatsappIcon(size: number): SatoriNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        width: size,
        height: size,
        borderRadius: 999,
        background: "#25D366",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    },
    h(
      "svg",
      { width: Math.round(size * 0.62), height: Math.round(size * 0.62), viewBox: "0 0 24 24", fill: WHITE },
      h("path", {
        d: "M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.1 2.2z"
      })
    )
  );
}

function footerRow(content: AdLayoutContent, color: string, fontSize = 28): SatoriNode {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" } },
    content.brandName
      ? h("div", { style: { display: "flex", color, fontSize, fontWeight: 700 } }, content.brandName)
      : h("div", { style: { display: "flex" } }, " "),
    content.phone
      ? h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 12 } },
          whatsappIcon(Math.round(fontSize * 1.4)),
          h("div", { style: { display: "flex", color, fontSize, fontWeight: 700 } }, content.phone)
        )
      : null
  );
}

function ctaPill(text: string, bg: string, color: string): SatoriNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        background: bg,
        color,
        fontSize: 30,
        fontWeight: 800,
        padding: "20px 50px",
        borderRadius: 999
      }
    },
    text
  );
}

/** Logo dentro de um selo branco arredondado (contraste sobre cor da marca). */
function logoBadge(logo: PreparedLogo): SatoriNode {
  return h(
    "div",
    { style: { display: "flex", background: "rgba(255,255,255,0.96)", borderRadius: 16, padding: "12px 22px" } },
    h("img", { src: logo.src, width: logo.width, height: logo.height })
  );
}

/**
 * Camada de fundo: gradiente da cor da operadora SEMPRE presente (plano B quando
 * nao ha foto/credito) + a foto da IA por cima quando disponivel.
 */
function photoBackdrop(uri: string | null, carrierColor: string): SatoriNode {
  const gradient = `linear-gradient(160deg, ${shade(carrierColor, 0.12)} 0%, ${carrierColor} 52%, ${shade(carrierColor, -0.3)} 100%)`;
  return h(
    "div",
    {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundImage: gradient
      }
    },
    uri
      ? h("img", {
          src: uri,
          // objectPosition enviesa para a parte de cima: nos formatos com recorte
          // (feed/vertical) favorece os rostos, deixando o rodape/corpo atras do painel.
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 30%"
          }
        })
      : null
  );
}

/** Barra solida de destaque (condicao comercial, oferta) em caixa alta. */
function solidBadge(text: string, bg: string, color: string, fontSize = 26): SatoriNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        background: bg,
        color,
        fontSize,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 1,
        padding: "12px 26px",
        borderRadius: 8
      }
    },
    text
  );
}

/**
 * Fundo da arte de recorte: cor da marca em degrade escuro + ondas organicas.
 * As ondas usam viewBox fixo com preserveAspectRatio "none", entao a mesma
 * curva se estica bem em 1:1, 4:5 e 9:16.
 */
function waveBackdrop(carrierColor: string): SatoriNode {
  const deep = shade(carrierColor, -0.68);
  const mid = shade(carrierColor, -0.42);
  const light = shade(carrierColor, 0.16);

  return h(
    "div",
    {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundImage: `linear-gradient(145deg, ${mid} 0%, ${deep} 58%, ${shade(carrierColor, -0.55)} 100%)`
      }
    },
    h(
      "svg",
      {
        width: "100%",
        height: "100%",
        viewBox: "0 0 1000 1000",
        preserveAspectRatio: "none",
        style: { position: "absolute", top: 0, left: 0 }
      },
      // faixa principal na cor da operadora
      h("path", {
        d: "M0,300 C220,215 430,395 640,330 C790,285 900,180 1000,120 L1000,352 C880,430 760,528 600,512 C420,494 250,404 0,472 Z",
        fill: carrierColor
      }),
      // faixa clara de brilho, mais fina, cruzando por cima
      h("path", {
        d: "M0,208 C240,120 420,302 660,226 C820,176 920,88 1000,28 L1000,146 C900,220 802,306 642,306 C452,306 250,192 0,278 Z",
        fill: light,
        opacity: 0.5
      }),
      // base escura: ancora o rodape e separa do recorte
      h("path", {
        d: "M0,772 C260,708 520,842 762,788 C880,762 950,726 1000,696 L1000,1000 L0,1000 Z",
        fill: deep,
        opacity: 0.72
      })
    )
  );
}

/* ---------------------------- recorte / impacto -------------------------- */

/**
 * Estilo de referencia do mercado de corretagem: fundo cheio na cor da marca
 * com ondas, pessoa RECORTADA (PNG sem fundo) ancorada na base a direita e
 * manchete em caixa alta na coluna da esquerda. Diferente dos outros estilos,
 * a foto nao e um retangulo cortado — por isso nenhum rosto e fatiado.
 */
function recorteTemplate(input: TemplateInput): SatoriNode {
  const { content, carrierColor, logo, cutout, format } = input;
  const dark = shade(carrierColor, -0.68);
  const isVertical = format.height / format.width >= 1.6;
  const padX = Math.round(format.width * 0.075);
  const padTop = Math.round(format.height * (isVertical ? 0.15 : 0.062));
  const padBottom = Math.round(format.height * (isVertical ? 0.17 : 0.062));

  const title = (content.title ?? "").trim();

  // Itens curtos (MEI, LTDA, ME...) viram uma coluna ao lado da manchete,
  // separada por barra vertical. Itens longos viram bullets com check.
  const items = (content.benefits ?? []).map((b) => b.title.trim()).filter(Boolean);
  const asTagColumn = items.length >= 2 && items.every((item) => item.length <= 14);
  const tagItems = asTagColumn ? items.slice(0, 5) : [];
  const bulletItems = asTagColumn ? [] : items.slice(0, 4);

  // Todas as larguras em px: a coluna de texto so pode usar a metade esquerda
  // quando ha recorte, e a manchete divide essa coluna com a lista de tags.
  const contentWidth = format.width - padX * 2;
  const columnWidth = Math.round(contentWidth * (cutout ? (isVertical ? 0.58 : 0.62) : 1));
  const tagFontSize = 36;
  const tagsWidth =
    tagItems.length > 0
      ? Math.round(
          tagItems.reduce((acc, item) => Math.max(acc, item.length), 1) * tagFontSize * UPPERCASE_EM
        ) + 8
      : 0;
  const headlineWidth = tagItems.length > 0 ? columnWidth - tagsWidth - 46 : columnWidth;
  const titleSize = fitHeadline(title, headlineWidth, { max: 106, min: 50 });

  const badges = [content.contractType, content.offer ?? content.subtitle]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Manrope"
      }
    },
    waveBackdrop(carrierColor),
    // recorte ancorado na base direita (sangra um pouco pela borda)
    cutout
      ? h("img", {
          src: cutout.src,
          width: cutout.width,
          height: cutout.height,
          // sempre ancorado na base: um recorte "flutuando" mostraria o corte
          // reto do enquadramento no meio da arte
          style: { position: "absolute", right: -Math.round(format.width * 0.03), bottom: 0 }
        })
      : null,
    // coluna de conteudo
    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: `${padTop}px ${padX}px ${padBottom}px`
        }
      },
      logo ? h("div", { style: { display: "flex" } }, logoBadge(logo)) : null,
      h("div", { style: { display: "flex", flexGrow: 1, minHeight: 24 } }),
      // manchete + itens curtos lado a lado
      h(
        "div",
        // com recorte, o texto fica confinado a metade esquerda para nunca
        // encostar na pessoa
        { style: { display: "flex", alignItems: "center", gap: 22, width: columnWidth } },
        h(
          "div",
          {
            style: {
              display: "flex",
              width: headlineWidth,
              color: WHITE,
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 0.94,
              letterSpacing: -2,
              textTransform: "uppercase"
            }
          },
          title
        ),
        tagItems.length > 0
          ? h(
              "div",
              { style: { display: "flex", width: 4, alignSelf: "stretch", background: WHITE, opacity: 0.9 } }
            )
          : null,
        tagItems.length > 0
          ? h(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 2, width: tagsWidth } },
              ...tagItems.map((item) =>
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      color: WHITE,
                      fontSize: tagFontSize,
                      fontWeight: 800,
                      lineHeight: 1.12,
                      textTransform: "uppercase"
                    }
                  },
                  item
                )
              )
            )
          : null
      ),
      bulletItems.length > 0
        ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: 14, marginTop: 30, width: columnWidth } },
            ...bulletItems.map((item) =>
              h(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 14 } },
                checkBadge(30, WHITE, carrierColor),
                h(
                  "div",
                  { style: { display: "flex", color: WHITE, fontSize: 26, fontWeight: 700, lineHeight: 1.2 } },
                  item
                )
              )
            )
          )
        : null,
      badges.length > 0
        ? h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 14,
                marginTop: 34,
                width: columnWidth
              }
            },
            ...badges.map((badge, index) => {
              // texto longo diminui para caber numa linha so dentro da coluna
              const size = fitFontSize(badge, {
                max: index === 0 ? 27 : 25,
                min: 19,
                charsAtMax: 22,
                charsAtMin: 42
              });
              return index === 0
                ? solidBadge(badge, WHITE, dark, size)
                : solidBadge(badge, carrierColor, WHITE, size);
            })
          )
        : null,
      h("div", { style: { display: "flex", flexGrow: 1, minHeight: 24 } }),
      // rodape: CTA + assinatura, sempre na faixa livre da esquerda
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 20,
            width: columnWidth
          }
        },
        content.cta ? ctaPill(content.cta, WHITE, dark) : null,
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 16 } },
          content.brandName
            ? h(
                "div",
                { style: { display: "flex", color: WHITE, opacity: 0.94, fontSize: 26, fontWeight: 700 } },
                content.brandName
              )
            : null,
          content.phone
            ? h(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 10 } },
                whatsappIcon(34),
                h("div", { style: { display: "flex", color: WHITE, fontSize: 26, fontWeight: 700 } }, content.phone)
              )
            : null
        )
      )
    )
  );
}

/* ------------------------- oferta / desconto ---------------------------- */

function ofertaTemplate(input: TemplateInput): SatoriNode {
  const { content, carrierColor, logo } = input;
  const dark = shade(carrierColor, -0.45);
  const accent = "#FFC53D";
  const pad = 84;

  const discount = content.discount ?? "";
  const match = discount.match(/(\d[\d.,]*\s*%)/);
  const bigNum = match ? match[1].replace(/\s+/g, "") : discount;
  const pre = match ? discount.slice(0, match.index).trim() : "";

  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${pad}px`,
        backgroundImage: `linear-gradient(150deg, ${shade(carrierColor, 0.1)} 0%, ${carrierColor} 45%, ${dark} 100%)`,
        fontFamily: "Manrope"
      }
    },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16 } },
      logo
        ? h(
            "div",
            {
              style: {
                display: "flex",
                background: "rgba(255,255,255,0.96)",
                borderRadius: 18,
                padding: "14px 26px",
                marginBottom: 20
              }
            },
            h("img", { src: logo.src, width: logo.width, height: logo.height })
          )
        : null,
      h(
        "div",
        { style: { display: "flex", color: WHITE, fontSize: 56, fontWeight: 800, textAlign: "center", lineHeight: 1.05 } },
        content.title
      ),
      content.subtitle
        ? h(
            "div",
            { style: { display: "flex", color: WHITE, opacity: 0.92, fontSize: 30, fontWeight: 600, textAlign: "center" } },
            content.subtitle
          )
        : null
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
      pre ? h("div", { style: { display: "flex", color: WHITE, fontSize: 44, fontWeight: 700 } }, pre) : null,
      h("div", { style: { display: "flex", color: accent, fontSize: 210, fontWeight: 800, lineHeight: 1 } }, bigNum),
      h(
        "div",
        { style: { display: "flex", color: WHITE, fontSize: 34, fontWeight: 800, letterSpacing: 8 } },
        "DE DESCONTO"
      ),
      content.contractType
        ? h(
            "div",
            {
              style: {
                display: "flex",
                marginTop: 22,
                background: "rgba(255,255,255,0.18)",
                color: WHITE,
                fontSize: 26,
                fontWeight: 700,
                padding: "10px 28px",
                borderRadius: 999
              }
            },
            content.contractType
          )
        : null
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 30, width: "100%" } },
      (() => {
        const diffs =
          content.differentials && content.differentials.length > 0
            ? content.differentials
            : (content.benefits ?? []).map((b) => b.title);
        return diffs.length > 0
          ? h(
              "div",
              { style: { display: "flex", justifyContent: "center", gap: 44 } },
              ...diffs.map((d) =>
              h(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 12, color: WHITE, fontSize: 24, fontWeight: 600 } },
                checkBadge(30, accent, dark),
                d
              )
            )
          )
            : null;
      })(),
      content.cta ? ctaPill(content.cta, accent, dark) : null,
      footerRow(content, WHITE)
    )
  );
}

/* --------------------------- medico / hospital -------------------------- */

function medicoTemplate(input: TemplateInput): SatoriNode {
  const { content, carrierColor, logo, backgroundUri, format } = input;
  const benefits = content.benefits ?? [];
  // larguras reais do bullet: em porcentagem o texto vazava por cima do check
  // do item vizinho (satori so quebra a linha com largura definida)
  const panelWidth = format.width - 120;
  const benefitWidth = Math.floor((panelWidth - 20) / 2);
  const benefitTextWidth = benefitWidth - 42;
  const photoGradient = `linear-gradient(160deg, ${shade(carrierColor, 0.12)} 0%, ${carrierColor} 60%, ${shade(carrierColor, -0.25)} 100%)`;

  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: carrierColor,
        fontFamily: "Manrope"
      }
    },
    // foto ocupa TODO o espaco que o painel nao usar (antes era 46% fixo, o que
    // deixava um bloco de cor vazio quando a arte tinha pouco texto)
    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          width: "100%",
          flexGrow: 1,
          minHeight: "34%",
          overflow: "hidden",
          backgroundImage: photoGradient
        }
      },
      backgroundUri
        ? h("img", {
            src: backgroundUri,
            style: { width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%" }
          })
        : // plano B sem foto: ondas da marca no lugar de um gradiente chapado
          waveBackdrop(carrierColor),
      // transicao suave para o painel: o corte nao bate seco no rosto
      h("div", {
        style: {
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 160,
          display: "flex",
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${carrierColor} 100%)`
        }
      })
    ),
    // painel com ALTURA INTRINSECA: cresce com o conteudo, nunca sobra vazio
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          gap: 22,
          background: carrierColor,
          marginTop: -46,
          borderTopLeftRadius: 56,
          borderTopRightRadius: 56,
          padding: "46px 60px 52px"
        }
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 6 } },
        h(
          "div",
          {
            style: {
              display: "flex",
              color: WHITE,
              fontSize: fitFontSize(content.title ?? "", {
                max: 84,
                min: 44,
                charsAtMax: 16,
                charsAtMin: 58
              }),
              fontWeight: 800,
              lineHeight: 1.04
            }
          },
          content.title
        ),
        content.contractType
          ? h("div", { style: { display: "flex", color: WHITE, opacity: 0.95, fontSize: 27, fontWeight: 700 } }, content.contractType)
          : null
      ),
      benefits.length > 0
        ? h(
            "div",
            { style: { display: "flex", flexWrap: "wrap", gap: 20 } },
            ...benefits.map((b) =>
              h(
                "div",
                { style: { display: "flex", alignItems: "flex-start", gap: 12, width: benefitWidth } },
                checkBadge(30, WHITE, carrierColor),
                h(
                  "div",
                  { style: { display: "flex", flexDirection: "column", gap: 2, width: benefitTextWidth } },
                  h("div", { style: { display: "flex", color: WHITE, fontSize: 23, fontWeight: 800, lineHeight: 1.15 } }, b.title),
                  b.detail
                    ? h("div", { style: { display: "flex", color: WHITE, opacity: 0.9, fontSize: 18, fontWeight: 600, lineHeight: 1.15 } }, b.detail)
                    : null
                )
              )
            )
          )
        : null,
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginTop: 10
          }
        },
        content.brandName
          ? h("div", { style: { display: "flex", color: WHITE, fontSize: 28, fontWeight: 700 } }, content.brandName)
          : h("div", { style: { display: "flex" } }, " "),
        content.cta
          ? ctaPill(content.cta, WHITE, carrierColor)
          : content.phone
            ? h(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 12 } },
                whatsappIcon(38),
                h("div", { style: { display: "flex", color: WHITE, fontSize: 28, fontWeight: 700 } }, content.phone)
              )
            : null
      )
    ),
    // logo em selo sobre a foto (topo-esquerda)
    logo ? h("div", { style: { position: "absolute", top: 44, left: 56, display: "flex" } }, logoBadge(logo)) : null
  );
}

/* ------------------------------- familia -------------------------------- */

function familiaTemplate(input: TemplateInput): SatoriNode {
  const { content, carrierColor, logo, backgroundUri } = input;
  const pad = 72;

  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Manrope"
      }
    },
    photoBackdrop(backgroundUri, carrierColor),
    // faixa superior (compacta)
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: carrierColor,
          padding: `46px ${pad}px 28px`
        }
      },
      logo ? h("img", { src: logo.src, width: logo.width, height: logo.height, style: { marginBottom: 4 } }) : null,
      h(
        "div",
        {
          style: {
            display: "flex",
            color: WHITE,
            fontSize: fitFontSize(content.title ?? "", { max: 86, min: 46, charsAtMax: 16, charsAtMin: 60 }),
            fontWeight: 800,
            lineHeight: 1.04
          }
        },
        content.title
      ),
      content.subtitle
        ? h("div", { style: { display: "flex", color: WHITE, opacity: 0.95, fontSize: 28, fontWeight: 700 } }, content.subtitle)
        : null
    ),
    h("div", { style: { display: "flex", flexGrow: 1 } }),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 18,
          background: carrierColor,
          borderTopLeftRadius: 44,
          borderTopRightRadius: 44,
          padding: `${Math.round(pad * 0.44)}px ${pad}px ${Math.round(pad * 0.62)}px`
        }
      },
      (() => {
        const cols =
          content.columns && content.columns.length > 0
            ? content.columns
            : splitBenefitsToColumns(content.benefits);
        return cols.length > 0
          ? h(
              "div",
              { style: { display: "flex", gap: 36 } },
              ...cols.map((col) =>
                h(
                  "div",
                  { style: { display: "flex", flexDirection: "column", gap: 9, flex: 1 } },
                  col.heading
                    ? h("div", { style: { display: "flex", color: WHITE, fontSize: 27, fontWeight: 800 } }, col.heading)
                    : null,
                  ...col.items.map((item) =>
                    h(
                      "div",
                      { style: { display: "flex", alignItems: "center", gap: 10 } },
                      checkBadge(25, WHITE, carrierColor),
                      h("div", { style: { display: "flex", color: WHITE, fontSize: 22, fontWeight: 600, lineHeight: 1.2 } }, item)
                    )
                  )
                )
              )
            )
          : null;
      })(),
      footerRow(content, WHITE)
    )
  );
}

/* ------------------------------ dispatcher ------------------------------ */

export function renderTemplateNode(input: TemplateInput): SatoriNode {
  switch (input.styleId) {
    case "oferta-desconto":
      return ofertaTemplate(input);
    case "recorte-impacto":
      return recorteTemplate(input);
    case "familia":
      return familiaTemplate(input);
    case "medico-hospital":
    default:
      return medicoTemplate(input);
  }
}
