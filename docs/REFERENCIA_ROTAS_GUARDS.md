# Referência de Rotas e Guards

Este documento mapeia as rotas existentes (pages e APIs) e os guards de permissão e autenticação aplicados.

## 1. Middleware (`middleware.ts`)

O middleware aplica as seguintes regras baseadas no `pathname`:
- **Rotas protegidas** (dashboard, team, invite, checkout, api): Exigem usuário autenticado.
- **Bloqueio de perfil incompleto**: Redireciona para `/onboarding/profile-setup` (exceto rotas de setup e invite).
- **`/team/*`**: Exige ser Manager (`owner` ou `admin`).
- **`/dashboard/importar`**: Exige ser Manager (em `team`) ou qualquer usuário em `solo`.
- **`/dashboard/criar-equipe`**: Exige ser `owner` em workspace `solo`.

## 2. Pages (App Router)

| Rota | Guard Usado (page/layout) | Papel Necessário | Tipo Workspace |
|---|---|---|---|
| `/dashboard/layout.tsx` | `requireCompletedProfile()` | Qualquer | Qualquer |
| `/dashboard/admin/pedidos` | `requirePlatformAdmin()` | `platform_admin` | Qualquer |
| `/dashboard/criar-equipe` | `requireSoloOwner()` | `owner` | `solo` |
| `/dashboard/importar` | `requireImportPermission()` | Manager ou Solo Owner | Qualquer |
| `/dashboard/integracoes/webhook-leads` | `requireWorkspaceManager()` | Manager (`owner`/`admin`) | Qualquer |
| `/dashboard/perfil/meta` | `requireWorkspaceManager()` | Manager (`owner`/`admin`) | Qualquer |
| `/dashboard/simulador` | `requireCompletedProfile()` | Qualquer | Qualquer |
| `/dashboard/criacoes/*` | `requireCompletedProfile()` | Qualquer | Qualquer |
| `/dashboard/leads/*` | `requireCompletedProfile()` | Qualquer | Qualquer |
| `/dashboard/perfil/*` | `requireCompletedProfile()` | Qualquer | Qualquer |
| `/dashboard/relatorios` | `requireCompletedProfile()` | Qualquer | Qualquer |
| `/dashboard/funil` | `requireCompletedProfile()` | Qualquer | Qualquer |
| Demais `/dashboard/*` | Nenhum (usa o do layout) | Qualquer | Qualquer |
| `/team/layout.tsx` | `requireWorkspaceManager()` | Manager (`owner`/`admin`) | Qualquer |
| `/team/setup` | `requireWorkspaceManager()` | Manager (`owner`/`admin`) | Qualquer |

## 3. API Routes

| Rota | Guard Usado | Papel Necessário | Observações |
|---|---|---|---|
| `/api/leads/*` | `assertServerAuth()` | Autenticado | Controle fino feito no repository (ex: `assignLeadOwnersInBulkForCurrentUser` exige role) |
| `/api/campaigns/*` | `assertServerAuth()` | Autenticado | Controle feito no repository |
| `/api/integrations/*` | `assertServerAuth()` | Autenticado | - |
| `/api/creative-requests/*` | `assertServerAuth()` | Autenticado | Controle feito no repository |
| `/api/billing/ai-credits/checkout` | `assertServerAuth()` | Autenticado | Idealmente deveria verificar role owner |
| `/api/billing/create-subscription` | `assertServerAuth()` | Autenticado | Idealmente deveria verificar role owner |
| `/api/billing/webhooks/*` | Assinatura HMAC | N/A | Webhook externo (MercadoPago) |
| `/api/webhooks/leads` | Nenhum explícito na API | N/A | Webhook externo |
| `/api/meta/webhook` | Assinatura/Verificação | N/A | Webhook externo |

## 4. Análise e Gaps Identificados

1. **APIs de Billing (`/api/billing/*`)**: Verificam apenas autenticação básica via `assertServerAuth()`. A API deveria explicitamente verificar se o usuário é o gestor (`owner`), para evitar que `seller` ou `admin` iniciem checkout via API. (A UI pode esconder o botão, mas a API precisa do bloqueio).
2. **Acesso cruzado de rotas UI**: `seller` consegue acessar `/dashboard/pedidos` ou `/dashboard/anuncios` pois não há guard além do `requireCompletedProfile()` no layout. Eles serão barrados nas queries do banco (RLS ou repositório), o que pode causar erros visuais na tela ou estados vazios, em vez de um redirecionamento seguro via Guard.
3. **Falta de controle de permissões granulares em `app/api/leads/export/route.ts`**: Verifica auth, mas delega pro repository (`getLeadExportRowsForCurrentUser`). A API de exportação deveria ser barrada diretamente com um guard (ex: `requireWorkspaceManager` equivalente para API).
