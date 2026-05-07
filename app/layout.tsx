import type { Metadata } from "next";
import "./globals.css";
import { getCanonicalUrl, getSiteMetadataBase, getSiteName } from "@/lib/site/config";

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title: {
    default: getSiteName(),
    template: `%s | ${getSiteName()}`
  },
  description:
    "CRM com IA para corretores de plano de saude empresarial organizarem leads e campanhas.",
  alternates: {
    canonical: getCanonicalUrl("/")
  },
  openGraph: {
    title: getSiteName(),
    description:
      "CRM com IA para corretores de plano de saude empresarial organizarem leads e campanhas.",
    url: getCanonicalUrl("/"),
    siteName: getSiteName(),
    type: "website",
    locale: "pt_BR"
  },
  twitter: {
    card: "summary_large_image",
    title: getSiteName(),
    description:
      "CRM com IA para corretores de plano de saude empresarial organizarem leads e campanhas."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
