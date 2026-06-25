# Segurança do Leadi

Relatório do estado de segurança do SaaS (CRM + Meta Ads) e checklist priorizado até o lançamento público.

> Última revisão: 25/06/2026.

---

## Como reportar uma vulnerabilidade

Encontrou uma falha de segurança? **Não** abra uma issue pública. Envie um e-mail para o contato legal/operacional do produto (`LEGAL_CONTACT_EMAIL`) com a descrição, passos de reprodução e impacto. Responderemos o mais rápido possível.

---

## ✅ O que já está implementado

### Autenticação e entrada
- **Login com Google em destaque** — o Google verifica o e-mail (prova de posse), reduzindo contas falsas sem precisar de confirmação por e-mail.
- **Captcha (Cloudflare Turnstile)** em login, cadastro e recuperação de senha — barra bots e brute-force automatizado.
- **Bloqueio de e-mail descartável + checagem de domínio (MX)** no cadastro (`src/lib/auth/email-validation.ts`).
- **Política de senha forte** — mínimo de 8 caracteres + letras e números (`supabase/config.toml`).
- **Recuperação de senha** ("Esqueci minha senha") com link seguro, token de uso único e expiração curta.
- **Rate limit no login/cadastro/reset** — por IP e por e-mail (`app/login/actions.ts`, `src/lib/api/action-security.ts`).
- **Mensagens genéricas** no login e no reset — não revelam se um e-mail existe (anti-enumeração).
- **Senha nunca visível por padrão** — campos mascarados com botão "mostrar" por pressão.

### Plataforma
- **RLS (Row Level Security)** por organização em todas as tabelas, com funções `SECURITY DEFINER` (`supabase/migrations/*rls*`).
- **Isolamento multi-tenant** — cada usuário só acessa dados da sua organização; permissões granulares por papel (owner/admin/supervisor/seller).
- **Cabeçalhos de segurança** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (`middleware.ts`).
- **Proteção CSRF** — checagem de Origin/Referer nas rotas de API (`src/lib/api/route-security.ts`).
- **Validação de entrada com Zod** nas rotas de API.
- **Webhooks assinados** — HMAC timing-safe (Meta, AbacatePay) e token com hash SHA-256 (leads).
- **Rate limit distribuído** via Supabase RPC com fallback local (`src/lib/rate-limit.ts`).
- **Gestão de segredos** — hook anti-segredos no commit (`.githooks/pre-commit`); nenhum `.env` com segredo real versionado; segredos sensíveis sem prefixo `NEXT_PUBLIC_`.

---

## ⬜ Pendências (priorizadas)

### 🔴 P0 — Bloqueadores de lançamento (configuração de produção)
- [x] **Domínio de produção no Supabase** — ✅ feito em 25/06/2026 via Management API: `site_url = https://useleadi.com` e `uri_allow_list` agora inclui `https://useleadi.com/auth/callback`, `/` e `/**` (URLs de preview da Vercel preservadas). Domínio verificado no ar (HTTP 200, servido pela Vercel).
- [x] **Captcha em produção** — ⚠️ parcial: site key real (widget `Leadi`, hostname `useleadi.com`, Managed) na Vercel produção **e** secret real **armazenada no Supabase** (provider `turnstile`) em 25/06/2026. **Mantido `security_captcha_enabled=false` de propósito** até o redeploy que coloca a site key real no frontend. **Falta:** (1) `vercel --prod` para subir build com a site key; (2) `PATCH .../config/auth {security_captcha_enabled:true}`. Ligar antes do redeploy bloquearia login (token de teste × secret real).
- [ ] **SMTP de produção (e-mail de reset)** — configurar um provedor (ex.: Resend) em Auth > SMTP no Supabase. Sem isso, o reset usa o e-mail padrão do Supabase (limite baixíssimo, cai em spam).
- [ ] **`ABACATE_PAY_WEBHOOK_SECRET` em produção** — **ausente na Vercel** (verificado em `vercel env ls production`). O webhook valida HMAC-SHA256 do corpo com este segredo (header `x-webhook-signature`); sem ele a assinatura é apenas logada, não verificada. O valor precisa ser **idêntico** ao configurado no painel do AbacatePay — defina lá e na Vercel com o mesmo valor (não pode ser inventado só de um lado, senão a assinatura não bate e os pagamentos param de confirmar).
- [x] **`SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` em produção** — ✅ confirmados na Vercel (`production`) em 25/06/2026 via `vercel env ls production` (`SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` presentes).
- [ ] **Rotação de chaves** — rotacionar chaves sensíveis (Supabase, OpenAI, Meta, AbacatePay) antes do lançamento (pendência de hardening jun/2026). Ação manual em cada provedor + atualizar Vercel/`.env.local`.
- [x] **Remover/validar `BILLING_DISABLED`** — ⚠️ parcial: default do `.env.example` mudado para `false` e adicionado guard de visibilidade em [src/lib/billing/config.ts](src/lib/billing/config.ts) (loga `BILLING_DISABLED_ACTIVE_IN_PRODUCTION` 1x por cold start quando `VERCEL_ENV=production` e a flag está ligada). **Ainda `true` na Vercel de propósito** durante a fase de testes (simula pagamento). **Antes do lançamento comercial:** `vercel env rm BILLING_DISABLED production` (ou setar `false`) e redeployar.

### 🟡 P1 — Importante para o lançamento
- [ ] **Proteção contra senha vazada (HIBP)** — habilitar "Leaked password protection" no painel do Supabase (Auth > Settings). Confirmar disponibilidade no plano atual.
- [ ] **Testar captcha real** — validar com chaves reais que login/cadastro/reset só completam com token válido.
- [ ] **Verificar redirect allowlist** — garantir que `/auth/callback` no domínio de produção está na allowlist do Supabase.
- [ ] **Política de senha no painel** — espelhar `minimum_password_length = 8` + `letters_digits` no painel do Supabase Cloud (config.toml vale só para o ambiente local).

### 🟢 P2 — Pós-lançamento / roadmap
- [ ] **Confirmação de e-mail (código/link)** — pausada por ora; a base do Supabase (`enable_confirmations`, OTP de 6 dígitos) está pronta para reativar.
- [ ] **MFA / 2FA** para contas de gestores (owner/admin).
- [ ] **CSP com nonce dinâmico** — remover `script-src 'unsafe-inline' 'unsafe-eval'` em produção.
- [ ] **Lista de e-mails descartáveis ampliada** — trocar a lista curada de `src/lib/auth/email-validation.ts` pelo pacote `disposable-email-domains`.
- [ ] **Rate limit por usuário** (além de por IP) em ações críticas autenticadas.
- [ ] **Auditoria/monitoramento** — revisar `audit_logs` e alertas de atividade suspeita.

---

## Notas de configuração

### Captcha (Cloudflare Turnstile)
- **Local/dev:** funciona out-of-the-box. O `config.toml` usa a *secret* de teste da Cloudflare (sempre passa) e o app usa a *site key* de teste quando `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está vazia.
- **Produção:** crie um site no Turnstile (dashboard da Cloudflare), coloque a **site key** em `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Vercel) e a **secret** no painel do Supabase (Auth > Settings).

### Fluxo de recuperação de senha
1. `/login/recuperar` → envia e-mail via `resetPasswordForEmail` (com captcha + rate limit).
2. O link cai em `/auth/callback?next=/redefinir-senha`, que troca o `code` por uma sessão de recuperação.
3. `/redefinir-senha` aplica a nova senha (`updateUser`) e encerra a sessão de recuperação, exigindo novo login.

### Variáveis de ambiente relevantes
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (pública) — site key do captcha.
- Secret do Turnstile e SMTP de e-mail → **painel do Supabase**, não no `.env` do app.
