const DEFAULT_META_GRAPH_API_VERSION = "v22.0";

export function getMetaVerifyToken() {
  return process.env.META_VERIFY_TOKEN?.trim() || "";
}

export function getMetaAppSecret() {
  return process.env.META_APP_SECRET?.trim() || "";
}

export function getMetaGraphApiVersion() {
  return process.env.META_GRAPH_API_VERSION?.trim() || DEFAULT_META_GRAPH_API_VERSION;
}
