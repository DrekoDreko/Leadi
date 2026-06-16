export type CompositorFormat = {
  /** Identificador do formato (so para logs). */
  id: string;
  width: number;
  height: number;
};

export const COMPOSITOR_FORMATS = {
  // Preview da tela de padroes (card quadrado).
  preview: { id: "preview", width: 1080, height: 1080 },
  // Feed Meta (4:5).
  feed: { id: "feed", width: 1080, height: 1350 },
  // Stories/Reels (9:16).
  vertical: { id: "vertical", width: 1080, height: 1920 }
} as const satisfies Record<string, CompositorFormat>;

export type AdBenefit = {
  title: string;
  detail?: string;
};

export type AdColumn = {
  heading: string;
  items: string[];
};

/**
 * Conteudo estruturado de uma arte. O compositor desenha exatamente estes
 * campos com fonte real — nada e "adivinhado" pelo modelo.
 */
export type AdLayoutContent = {
  title: string;
  subtitle?: string;
  /** Linha de condicao, ex: "PME a partir de 3 vidas". */
  contractType?: string;
  /** Heroi do estilo oferta, ex: "até 40%". */
  discount?: string;
  /** Linha de apoio (custo-beneficio, slogan). */
  offer?: string;
  /** Bullets do estilo medico/hospital. */
  benefits?: AdBenefit[];
  /** Colunas do estilo familia (Para sua familia / Para empresas). */
  columns?: AdColumn[];
  /** Diferenciais com icone do estilo oferta. */
  differentials?: string[];
  /** Texto do botao/CTA. */
  cta?: string;
  phone?: string;
  brandName?: string;
};

export type ComposeAdInput = {
  styleId: string;
  format: CompositorFormat;
  content: AdLayoutContent;
  /** Cor primaria da operadora (hex). */
  carrierColor: string;
  /** Logo oficial da operadora (PNG/qualquer formato sharp). */
  logo?: Buffer | null;
  /** Foto/fundo gerado pela IA (medico/familia). Oferta nao usa. */
  background?: Buffer | null;
};
