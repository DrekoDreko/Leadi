import type { Metadata } from "next";
import "./globals.css";
import { getCanonicalUrl, getSiteMetadataBase, getSiteName } from "@/lib/site/config";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title: {
    default: getSiteName(),
    template: `%s | ${getSiteName()}`
  },
  description:
    "Plataforma para captar, organizar e acompanhar leads com funil comercial, integrações e automações.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png"
  },
  alternates: {
    canonical: getCanonicalUrl("/")
  },
  openGraph: {
    title: `${getSiteName()} — Anúncios com IA e CRM para corretores de planos de saúde`,
    description:
      "Crie campanhas com IA, receba leads do Facebook e Instagram direto no CRM e acompanhe cada oportunidade até a proposta.",
    url: getCanonicalUrl("/"),
    siteName: getSiteName(),
    type: "website",
    locale: "pt_BR"
  },
  twitter: {
    card: "summary_large_image",
    title: `${getSiteName()} — Anúncios com IA e CRM para corretores de planos de saúde`,
    description:
      "Crie campanhas com IA, receba leads do Facebook e Instagram direto no CRM e acompanhe cada oportunidade até a proposta."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
