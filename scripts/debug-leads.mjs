import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  const contents = readFileSync(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, "$1");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  console.log("--- Debugging Profiles ---");
  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("*")
    .ilike("full_name", "%Test User%")
    .limit(5);

  if (pError) console.error("Error fetching profiles:", pError);
  else console.log("Profiles found:", JSON.stringify(profiles, null, 2));

  if (profiles && profiles.length > 0) {
    const orgId = profiles[0].organization_id;
    console.log(`\n--- Debugging Leads for Org: ${orgId} ---`);
    const { data: leads, error: lError, count } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId)
      .limit(5);

    if (lError) console.error("Error fetching leads:", lError);
    else console.log(`Leads count: ${count}, found:`, JSON.stringify(leads, null, 2));
  }
}

debug();
