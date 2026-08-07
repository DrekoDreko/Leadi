# Segurança do Leadi

Relatório do estado de segurança do SaaS (CRM + Meta Ads) e checklist priorizado até o lançamento público.

> Última revisão: 25/06/2026.

---

## Como reportar uma vulnerabilidade

Encontrou uma falha de segurança? **Não** abra uma issue pública. Envie um e-mail para o contato legal/operacional do produto (`adm@codeellow.com`) com a descrição, passos de reprodução e impacto. Responderemos o mais rápido possível.

---

## ✅ O que já está implementado

### Autenticação e entrada
- **Login com Google em destaque**
- **Captcha (Cloudflare Turnstile)** 
- **Bloqueio de e-mail descartável + checagem de domínio (MX)** 
- **Política de senha forte** 
- **Recuperação de senha** 
- **Rate limit no login/cadastro/reset** 
- **Mensagens genéricas** 
- **Senha nunca visível por padrão** 
- **Domínio de produção no Supabase** 
- **Captcha em produção** 
- **SMTP de produção (e-mail de reset)** 

### Plataforma
- **RLS (Row Level Security)** por organização em todas as tabelas, com funções `SECURITY DEFINER` (`supabase/migrations/*rls*`).
- **Isolamento multi-tenant** — cada usuário só acessa dados da sua organização; permissões granulares por papel (owner/admin/supervisor/seller).
- **Cabeçalhos de segurança** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (`middleware.ts`).
- **Proteção CSRF** — checagem de Origin/Referer nas rotas de API (`src/lib/api/route-security.ts`).
- **Validação de entrada com Zod** nas rotas de API.
- **Webhooks assinados** — HMAC timing-safe (Meta, AbacatePay) e token com hash SHA-256 (leads).
- **Rate limit distribuído** via Supabase RPC com fallback local (`src/lib/rate-limit.ts`).
- **Gestão de segredos** — hook anti-segredos no commit (`.githooks/pre-commit`); nenhum `.env` com segredo real versionado; segredos sensíveis sem prefixo `NEXT_PUBLIC_`.


### 🟢 Para implementar no Pós-lançamento / roadmap
- [ ] **Confirmação de e-mail (código/link)** — pausada por ora; a base do Supabase (`enable_confirmations`, OTP de 6 dígitos) está pronta para reativar.
- [ ] **MFA / 2FA** para contas de gestores (owner/admin).
- [ ] **CSP com nonce dinâmico** — remover `script-src 'unsafe-inline' 'unsafe-eval'` em produção.
- [ ] **Lista de e-mails descartáveis ampliada** — trocar a lista curada de `src/lib/auth/email-validation.ts` pelo pacote `disposable-email-domains`.
- [ ] **Rate limit por usuário** (além de por IP) em ações críticas autenticadas.
- [ ] **Auditoria/monitoramento** — revisar `audit_logs` e alertas de atividade suspeita.