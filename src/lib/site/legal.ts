import type { Metadata } from "next";
import { getCanonicalUrl, getSiteMetadataBase, getSiteName } from "@/lib/site/config";

export function buildLegalMetadata(input: {
  description: string;
  pathname: string;
  title: string;
}): Metadata {
  const siteName = getSiteName();
  const canonical = getCanonicalUrl(input.pathname);

  return {
    title: `${input.title} | ${siteName}`,
    description: input.description,
    metadataBase: getSiteMetadataBase(),
    alternates: {
      canonical
    },
    openGraph: {
      title: `${input.title} | ${siteName}`,
      description: input.description,
      url: canonical,
      siteName,
      type: "website",
      locale: "pt_BR"
    },
    twitter: {
      card: "summary",
      title: `${input.title} | ${siteName}`,
      description: input.description
    }
  };
}
