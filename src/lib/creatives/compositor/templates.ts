import { h, type SatoriNode } from "./h";
import { shade } from "./colors";
import type { AdBenefit, AdColumn, AdLayoutContent } from "./types";
import type { PreparedLogo } from "./render";

export type TemplateInput = {
  styleId: string;
  content: AdLayoutContent;
  carrierColor: string;
  logo: PreparedLogo | null;
  backgroundUri: string | null;
};

const WHITE = "#FFFFFF";

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
    // faixa superior (compacta: so logo + titulo + condicao)
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: carrierColor,
          padding: `48px ${pad}px 30px`
        }
      },
      logo ? h("img", { src: logo.src, width: logo.width, height: logo.height, style: { marginBottom: 4 } }) : null,
      h(
        "div",
        { style: { display: "flex", color: WHITE, fontSize: 56, fontWeight: 800, lineHeight: 1.02 } },
        content.title
      ),
      content.contractType
        ? h("div", { style: { display: "flex", color: WHITE, opacity: 0.95, fontSize: 30, fontWeight: 700 } }, content.contractType)
        : null
    ),
    // espaco da foto (cresce e ocupa o centro)
    h("div", { style: { display: "flex", flexGrow: 1 } }),
    // painel inferior
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 26,
          background: carrierColor,
          borderTopLeftRadius: 48,
          borderTopRightRadius: 48,
          padding: `${Math.round(pad * 0.66)}px ${pad}px ${Math.round(pad * 0.86)}px`
        }
      },
      content.benefits && content.benefits.length > 0
        ? h(
            "div",
            { style: { display: "flex", justifyContent: "space-between", gap: 24 } },
            ...content.benefits.map((b) =>
              h(
                "div",
                { style: { display: "flex", flexDirection: "column", gap: 8, flex: 1 } },
                h(
                  "div",
                  { style: { display: "flex", alignItems: "center", gap: 12 } },
                  checkBadge(34, WHITE, carrierColor),
                  h("div", { style: { display: "flex", color: WHITE, fontSize: 27, fontWeight: 800 } }, b.title)
                ),
                b.detail
                  ? h("div", { style: { display: "flex", color: WHITE, opacity: 0.92, fontSize: 22, fontWeight: 600, lineHeight: 1.2 } }, b.detail)
                  : null
              )
            )
          )
        : null,
      content.cta
        ? h("div", { style: { display: "flex", justifyContent: "center" } }, ctaPill(content.cta, WHITE, carrierColor))
        : null,
      footerRow(content, WHITE)
    )
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
        { style: { display: "flex", color: WHITE, fontSize: 52, fontWeight: 800, lineHeight: 1.04 } },
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
    case "familia":
      return familiaTemplate(input);
    case "medico-hospital":
    default:
      return medicoTemplate(input);
  }
}
