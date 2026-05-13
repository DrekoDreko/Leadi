import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(process.cwd());

function loadEnvFile(filename) {
  const path = resolve(PROJECT_ROOT, filename);
  if (!existsSync(path)) return;
  const contents = readFileSync(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, key);

async function validate() {
  console.log("1. Creating test lead...");
  const { data: lead, error: createError } = await supabase
    .from("leads")
    .insert({
      organization_id: (await supabase.from("organizations").select("id").limit(1).single()).data.id,
      name: "Test Agenda UX",
      stage: "new",
      source: "manual",
      score: 50,
      next_contact_at: "2026-05-20T10:00:00Z"
    })
    .select("*")
    .single();

  if (createError) {
    console.error("Create error:", createError);
    return;
  }
  console.log("Lead created with next_contact_at:", lead.next_contact_at);

  console.log("2. Updating next_contact_at...");
  const newDate = "2026-05-21T14:30:00Z";
  const { data: updatedLead, error: updateError } = await supabase
    .from("leads")
    .update({ next_contact_at: newDate })
    .eq("id", lead.id)
    .select("*")
    .single();

  if (updateError) {
    console.error("Update error:", updateError);
  } else {
    console.log("Lead updated with next_contact_at:", updatedLead.next_contact_at);
  }

  console.log("3. Clearing next_contact_at...");
  const { data: clearedLead, error: clearError } = await supabase
    .from("leads")
    .update({ next_contact_at: null })
    .eq("id", lead.id)
    .select("*")
    .single();

  if (clearError) {
    console.error("Clear error:", clearError);
  } else {
    console.log("Lead cleared next_contact_at:", clearedLead.next_contact_at);
  }

  console.log("4. Cleaning up test lead...");
  await supabase.from("leads").delete().eq("id", lead.id);
  console.log("Done.");
}

validate();
