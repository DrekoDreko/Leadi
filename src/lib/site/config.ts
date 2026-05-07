const DEFAULT_SITE_URL = "http://localhost:3000";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

type HeaderStore = {
  get(name: string): string | null;
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_SITE_URL;
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL);
}

export function getConfiguredSiteUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    return null;
  }

  return normalizeUrl(value);
}

export function getSiteMetadataBase() {
  return new URL(getSiteUrl());
}

export function getSiteName() {
  return process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "LeadHealth";
}

export function getSiteLegalEmail() {
  return (
    process.env.LEGAL_CONTACT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    ""
  );
}

export function getSiteDomainLabel() {
  return getSiteMetadataBase().host;
}

export function getCanonicalUrl(pathname = "/") {
  const url = getSiteMetadataBase();
  url.pathname = pathname;
  url.search = "";
  return url.toString();
}

export function getRequestOrigin(headerStore: HeaderStore) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return getConfiguredSiteUrl() ?? DEFAULT_SITE_URL;
  }

  return normalizeUrl(`${protocol}://${host}`);
}

export function getAuthCallbackOrigin(headerStore: HeaderStore) {
  const requestOrigin = getRequestOrigin(headerStore);

  if (isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }

  return getConfiguredSiteUrl() ?? requestOrigin;
}

function isLocalOrigin(value: string) {
  try {
    return LOCAL_HOSTNAMES.has(new URL(value).hostname);
  } catch {
    return false;
  }
}
