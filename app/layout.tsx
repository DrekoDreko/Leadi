import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadHealth",
  description:
    "CRM com IA para corretores de plano de saúde empresarial organizarem leads e campanhas."
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
