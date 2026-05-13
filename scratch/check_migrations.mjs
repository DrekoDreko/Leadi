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
    if (!match) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, "$1");
  }
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log("Checking for update_brokerage_name RPC...");
  const { error: rpcError } = await supabase.rpc("update_brokerage_name", { brokerage_name: "Test" });
  if (rpcError) {
    console.log("RPC update_brokerage_name error:", rpcError.message);
  } else {
    console.log("RPC update_brokerage_name exists and worked!");
  }

  console.log("\nChecking for system_templates table...");
  const { data, error: tableError } = await supabase.from("system_templates").select("id").limit(1);
  if (tableError) {
    console.log("Table system_templates error:", tableError.message);
  } else {
    console.log("Table system_templates exists!");
  }
}

check();
