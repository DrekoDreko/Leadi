import type { MetadataRoute } from "next";
import { getCanonicalUrl } from "@/lib/site/config";

const PUBLIC_ROUTES = ["/", "/pricing", "/preview", "/privacy", "/terms", "/data-deletion"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: getCanonicalUrl(route),
    lastModified
  }));
}
