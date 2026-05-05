const creativeRequestMigrationFiles = [
  "202604300002_creative_requests.sql",
  "202604300003_creative_requests_form_fields.sql",
  "202604300004_creative_requests_storage.sql",
  "202605040002_creative_request_comments.sql"
] as const;

const creativeRequestSetupNeedles = [
  "public.creative_requests",
  "public.creative_request_comments",
  "creative_requests_objective",
  "creative_requests_notes",
  "column creative_requests.objective does not exist",
  "column creative_requests.notes does not exist",
  "schema cache"
] as const;

export function isCreativeRequestSetupErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  return creativeRequestSetupNeedles.some((needle) =>
    normalizedMessage.includes(needle.toLowerCase())
  );
}

export function getCreativeRequestSetupErrorMessage() {
  return `Pedidos criativos ainda nao foram provisionados neste banco. Aplique o arquivo \`supabase/manual_creative_requests_setup.sql\` no SQL Editor do Supabase ou rode as migrations ${creativeRequestMigrationFiles.map((file) => `\`${file}\``).join(", ")} e atualize o schema cache antes de testar esta area.`;
}
