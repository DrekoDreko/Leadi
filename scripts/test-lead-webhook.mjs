import { readFileSync } from "node:fs";

const defaultPayload = {
  lead: {
    name: "Teste webhook LeadHealth",
    email: "teste.webhook@leadhealth.demo",
    phone: "+5511999998888",
    city: "Sao Paulo",
    interest: "Plano empresarial",
    source: "make_zapier",
    notes: "Disparo manual para validar recebimento em tempo quase real."
  }
};

async function main() {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL?.trim();
  const webhookToken = process.env.LEAD_WEBHOOK_TOKEN?.trim();

  if (!webhookUrl || !webhookToken) {
    console.error(
      "Defina LEAD_WEBHOOK_URL e LEAD_WEBHOOK_TOKEN antes de rodar o teste."
    );
    process.exit(1);
  }

  const payload = loadPayload();
  const startedAt = Date.now();
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-leadhealth-token": webhookToken
    },
    body: JSON.stringify(payload)
  });

  const durationMs = Date.now() - startedAt;
  const responseText = await response.text();

  console.log(JSON.stringify({
    ok: response.ok,
    status: response.status,
    duration_ms: durationMs,
    payload,
    response: tryParseJson(responseText)
  }, null, 2));

  if (!response.ok) {
    process.exit(1);
  }
}

function loadPayload() {
  const payloadFile = process.env.LEAD_WEBHOOK_PAYLOAD_FILE?.trim() || process.argv[2];

  if (!payloadFile) {
    return defaultPayload;
  }

  return JSON.parse(readFileSync(payloadFile, "utf8"));
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
