import "server-only";

import { promises as dns } from "node:dns";

/**
 * Validacao de e-mail no cadastro. Como pausamos a confirmacao por e-mail,
 * esta camada reduz contas falsas/bots:
 *  - bloqueia dominios descartaveis/temporarios conhecidos;
 *  - confirma (best-effort) que o dominio consegue receber e-mail (MX/A).
 *
 * Importante: isto NAO prova posse do e-mail (so o Google OAuth/SMS provam).
 * E uma camada extra, somada ao Turnstile e ao login com Google em destaque.
 */

// Lista curada dos descartaveis mais comuns. Pode ser ampliada ou trocada
// pelo pacote `disposable-email-domains` no futuro (ver SECURITY.md).
const DISPOSABLE_DOMAINS = new Set<string>([
  "0815.ru",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.de",
  "20minutemail.com",
  "33mail.com",
  "anonbox.net",
  "armyspy.com",
  "burnermail.io",
  "byom.de",
  "cuvox.de",
  "dayrep.com",
  "deadaddress.com",
  "discard.email",
  "discardmail.com",
  "dispostable.com",
  "e4ward.com",
  "einrot.com",
  "emailondeck.com",
  "fakeinbox.com",
  "fakemail.net",
  "fakemailgenerator.com",
  "fexbox.org",
  "fleckens.hu",
  "getairmail.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "gustr.com",
  "harakirimail.com",
  "inboxkitten.com",
  "jetable.org",
  "jourrapide.com",
  "luxusmail.org",
  "maildrop.cc",
  "maileater.com",
  "mailcatch.com",
  "mailexpire.com",
  "mailinator.com",
  "mailnesia.com",
  "mailnull.com",
  "mailsac.com",
  "mailto.plus",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "nada.email",
  "owlymail.com",
  "rcpt.at",
  "rhyta.com",
  "sharklasers.com",
  "spam4.me",
  "spambog.com",
  "spamgourmet.com",
  "superrito.com",
  "teleworm.us",
  "temp-mail.io",
  "temp-mail.org",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.plus",
  "tempmailaddress.com",
  "tempmailo.com",
  "tempr.email",
  "throwaway.email",
  "throwawaymail.com",
  "tmpmail.net",
  "tmpmail.org",
  "trash-mail.com",
  "trashmail.com",
  "trashmail.de",
  "vomoto.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net"
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DNS_TIMEOUT_MS = 2500;

export type EmailValidationReason = "format" | "disposable" | "undeliverable";

export type EmailValidationResult =
  | { ok: true; domain: string }
  | { ok: false; reason: EmailValidationReason };

export function getEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) {
    return null;
  }
  return email.slice(at + 1).trim().toLowerCase();
}

export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(Object.assign(new Error("dns-timeout"), { code: "ETIMEOUT" })),
        ms
      )
    )
  ]);
}

// Retorna a lista de registros, [] quando o dominio claramente nao tem o
// registro (ENOTFOUND/ENODATA) ou "neterror" para falhas ambiguas (timeout,
// SERVFAIL) — nesses casos preferimos liberar (fail-open).
async function safeResolve<T>(fn: () => Promise<T[]>): Promise<T[] | "neterror"> {
  try {
    return await withTimeout(fn(), DNS_TIMEOUT_MS);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return [];
    }
    return "neterror";
  }
}

async function domainCanReceiveEmail(domain: string): Promise<boolean> {
  const mx = await safeResolve(() => dns.resolveMx(domain));
  if (mx === "neterror") {
    return true; // falha de rede: nao bloqueia usuario legitimo
  }
  if (mx.length > 0) {
    return true;
  }

  // Sem MX: pelo RFC, o dominio ainda pode receber via registro A. Confere.
  const a = await safeResolve(() => dns.resolve(domain));
  if (a === "neterror") {
    return true;
  }
  return a.length > 0;
}

/**
 * Valida o e-mail de cadastro. So bloqueia em casos claros (formato invalido,
 * dominio descartavel, ou dominio inexistente). Erros de rede liberam.
 */
export async function assertDeliverableEmail(email: string): Promise<EmailValidationResult> {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalized)) {
    return { ok: false, reason: "format" };
  }

  const domain = getEmailDomain(normalized);
  if (!domain) {
    return { ok: false, reason: "format" };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: "disposable" };
  }

  const deliverable = await domainCanReceiveEmail(domain);
  if (!deliverable) {
    return { ok: false, reason: "undeliverable" };
  }

  return { ok: true, domain };
}
