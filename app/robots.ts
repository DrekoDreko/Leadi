import type { MetadataRoute } from "next";
import { getSiteMetadataBase } from "@/lib/site/config";

export default function robots(): MetadataRoute.Robots {
  const metadataBase = getSiteMetadataBase();

  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${metadataBase.toString().replace(/\/$/, "")}/sitemap.xml`
  };
}
