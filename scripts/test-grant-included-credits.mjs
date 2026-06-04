#!/usr/bin/env node
// Testa o RPC grant_subscription_included_ai_credits contra a assinatura ativa
// do plano 'equipe' seedada (org da Equipe Codeellow). Valida a concessao dos
// creditos inclusos e a idempotencia (segunda chamada nao deve creditar de novo).
//
// Uso: node --env-file=.env.local scripts/test-grant-included-credits.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function fail(msg, extra) {
  console.error(`\n❌ FALHOU: ${msg}`);
  if (extra) console.error(extra);
  process.exit(1);
}

// 1. Localiza a assinatura ativa do plano 'equipe'
const { data: plan, error: planErr } = await supabase
  .from("plans")
  .select("id, code, metadata")
  .eq("code", "equipe")
  .single();
if (planErr || !plan) fail("plano 'equipe' nao encontrado", planErr?.message);

const expectedIncluded = Number(plan.metadata?.included_credits ?? 0);

const { data: sub, error: subErr } = await supabase
  .from("subscriptions")
  .select("id, organization_id, status, current_period_start, current_period_end")
  .eq("plan_id", plan.id)
  .eq("status", "active")
  .order("created_at", { ascending: false })
  .limit(1)
  .single();
if (subErr || !sub) fail("assinatura ativa do plano 'equipe' nao encontrada", subErr?.message);

console.log(`Assinatura: ${sub.id} (org ${sub.organization_id})`);
console.log(`Creditos inclusos esperados no plano: ${expectedIncluded}`);

const refId = `${sub.id}:${sub.current_period_start}`;

async function callGrant(label) {
  const { data, error } = await supabase.rpc("grant_subscription_included_ai_credits", {
    target_subscription_id: sub.id,
    p_reference_id: refId,
    p_metadata: { test: true, label },
  });
  if (error) fail(`RPC retornou erro (${label}) — a migration de correcao foi aplicada?`, error.message);
  const row = Array.isArray(data) ? data[0] : data;
  console.log(`\n[${label}]`, row);
  return row;
}

// 2. Primeira chamada — concede (ou ja estava concedido por este reference_id)
const first = await callGrant("1a chamada");

// 3. Segunda chamada — deve ser idempotente
const second = await callGrant("2a chamada (idempotencia)");

// 4. Asserts
if (!second.already_processed) {
  fail("a 2a chamada deveria retornar already_processed=true (idempotencia)");
}
if (second.new_balance !== first.new_balance) {
  fail(`saldo mudou entre chamadas (idempotencia quebrada): ${first.new_balance} -> ${second.new_balance}`);
}

// 5. Confere saldo final na tabela
const { data: bal } = await supabase
  .from("org_ai_balances")
  .select("available_credits, included_credits_balance, purchased_credits_balance")
  .eq("org_id", sub.organization_id)
  .single();

console.log("\nSaldo final org_ai_balances:", bal);

if ((bal?.included_credits_balance ?? 0) < expectedIncluded) {
  fail(`included_credits_balance (${bal?.included_credits_balance}) < esperado (${expectedIncluded})`);
}

console.log("\n✅ OK: concessao funcionou e a 2a chamada foi idempotente.");
