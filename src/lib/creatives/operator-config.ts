export type OperatorConfig = {
  slug: string;
  name: string;
  primaryColor: string;
  logoPath: string;
};

export const OPERATORS: OperatorConfig[] = [
  {
    slug: "amil",
    name: "Amil",
    primaryColor: "#003366",
    logoPath: "/creatives/logos/operadoras/amil.png"
  },
  {
    slug: "hapvida",
    name: "Hapvida",
    primaryColor: "#00A651",
    logoPath: "/creatives/logos/operadoras/hapvida.png"
  },
  {
    slug: "sulamerica",
    name: "SulAmérica",
    primaryColor: "#F27A1A",
    logoPath: "/creatives/logos/operadoras/sulamerica.png"
  },
  {
    slug: "unimed",
    name: "Unimed",
    primaryColor: "#00995D",
    logoPath: "/creatives/logos/operadoras/unimed.png"
  },
  {
    slug: "bradesco-saude",
    name: "Bradesco Saúde",
    primaryColor: "#CC092F",
    logoPath: "/creatives/logos/operadoras/bradesco-saude.png"
  },
  {
    slug: "notredame",
    name: "NotreDame Intermédica",
    primaryColor: "#1B3A6B",
    logoPath: "/creatives/logos/operadoras/notredame.png"
  },
  {
    slug: "porto-seguro",
    name: "Porto Seguro",
    primaryColor: "#003DA5",
    logoPath: "/creatives/logos/operadoras/porto-seguro.png"
  },
  {
    slug: "medsenior",
    name: "MedSênior",
    primaryColor: "#5B8C3E",
    logoPath: "/creatives/logos/operadoras/medsenior.png"
  },
  {
    slug: "alice",
    name: "Alice",
    primaryColor: "#E91E8C",
    logoPath: "/creatives/logos/operadoras/alice.png"
  }
];

export function getOperator(slug: string): OperatorConfig | undefined {
  return OPERATORS.find((op) => op.slug === slug);
}
