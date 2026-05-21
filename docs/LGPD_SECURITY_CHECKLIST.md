# LGPD Security Checklist - Leads, Logs e Auditoria

Data da revisao: 2026-05-20  
Escopo: CRM de leads, importacoes, exportacoes, logs, integracoes Meta, dados financeiros e trilhas de auditoria.

> Objetivo: usar esta checklist como referencia operacional para privacidade, seguranca e prestacao de contas no tratamento de dados pessoais de leads e clientes.

Legenda de leitura:

- `Implementado`: controle observado no codigo atual.
- `Parcial`: controle existe, mas com lacunas relevantes.
- `Pendente`: controle ainda nao foi implementado ou nao foi encontrado de forma confiavel.

## 1. Inventario de dados pessoais e sensiveis

| Controle | Estado atual | Observacao |
|---|---|---|
| Existe inventario dos campos pessoais tratados em leads | Parcial | O codigo e a auditoria mostram nome, telefone, email, cidade, origem, campanha, formulario, observacoes, historico, status do funil e payloads Meta, mas ainda falta inventario formal por base legal e finalidade. |
| Segredos de integracao sao tratados como dados de alto risco | Implementado | Tokens Meta/OpenAI ficam server-side e cifrados, embora ainda existam riscos de leitura indireta e logs operacionais. |
| Dados financeiros e logs de eventos entram no escopo de protecao | Implementado | Tabelas de billing, creditos e eventos aparecem no review de seguranca e precisam manter acesso gerencial restrito. |

## 2. Base legal, consentimento e origem do lead

| Controle | Estado atual | Observacao |
|---|---|---|
| Origem do lead e registrada | Implementado | `source`, campanha, adset, anuncio e ids Meta ja aparecem no modelo de leads. |
| O produto consegue diferenciar lead manual, CSV, Meta e webhook | Implementado | O CRM usa `manual`, `csv_import`, `meta_lead_ads`, `make_zapier` e `api`. |
| Existe documentacao operacional para validar base legal por origem | Parcial | A aplicacao registra origem, mas ainda falta checklist obrigatoria por fluxo para consentimento, execucao contratual ou legitimo interesse. |
| Existe comprovacao de consentimento quando a origem exigir consentimento | Pendente | Nao foi encontrada trilha dedicada para armazenar prova de consentimento por lead/origem. |
| Existe governanca para reuso de leads importados da Meta em outros canais | Pendente | Precisa de regra explicita sobre uso posterior em WhatsApp, exportacao e enriquecimento interno. |

## 3. Controle de acesso por papel e organizacao

| Controle | Estado atual | Observacao |
|---|---|---|
| Leads sao isolados por `organization_id` | Implementado | O isolamento aparece no repository e nas policies RLS. |
| Consultores (`seller`) veem apenas os proprios leads | Implementado | Restricao observada na aplicacao e no banco. |
| Owners/admins veem os leads da organizacao | Implementado | Tratados como managers na camada de permissao e RLS. |
| A nomenclatura de papeis esta alinhada entre produto e banco | Parcial | O produto opera com `owner`, `admin` e `seller`; `supervisor` aparece como papel historico em migrations antigas. |
| Logs operacionais com nomes de leads ficam restritos a managers | Pendente | A tela `/dashboard/integracoes/webhook-leads` ainda pode ser acessada por qualquer perfil autenticado com perfil completo. |
| Downloads de dados exigem autenticacao e permissao | Parcial | Exportacao CSV exige sessao e respeita escopo visivel, mas ainda falta trilha de auditoria e governanca de finalidade. |

## 4. Logs e minimizacao de dados

| Controle | Estado atual | Observacao |
|---|---|---|
| Existe mascaramento de campos sensiveis no logger | Parcial | `src/lib/logger.ts` mascara por nome de chave, mas nao cobre todo o escopo sensivel do CRM. |
| Tokens nao sao logados em claro | Implementado | Chaves como `token`, `key`, `secret`, `authorization` e similares entram na mascaracao. |
| Payload bruto de webhook e minimizado antes de persistir | Parcial | `lead_webhook_events` recebe `sensitize()`, mas ainda pode manter PII em arrays/estruturas livres. |
| Erros internos sao sanitizados antes de chegar ao usuario | Parcial | Melhorou em varias rotas, mas ainda e preciso evitar reflexo de detalhes internos em todos os fluxos externos. |
| Existe politica formal de retencao para logs de webhook e integracao | Pendente | Nao foi encontrada regra documental com prazo, descarte e base legal. |

## 5. Exportacao segura

| Controle | Estado atual | Observacao |
|---|---|---|
| Exportacao CSV nao e publica | Implementado | A rota exige autenticacao. |
| Exportacao respeita o escopo visivel do usuario | Implementado | Sellers exportam apenas o que conseguem consultar. |
| Exportacao registra ator, filtros, volume e timestamp | Pendente | Nao existe auditoria persistente de exportacao. |
| Exportacao tem aprovacao ou papel gerencial obrigatorio | Parcial | Hoje depende do escopo natural do usuario autenticado; validar se o produto quer restringir exportacao a managers. |
| Exportacoes tem politica de retencao e orientacao de descarte | Pendente | Falta procedimento formal para arquivo exportado fora do SaaS. |

## 6. Retencao e descarte

| Controle | Estado atual | Observacao |
|---|---|---|
| Existe retencao definida para leads perdidos, duplicados e arquivados | Pendente | O sistema arquiva, mas nao foi encontrada politica formal de prazo. |
| Existe retencao definida para `lead_webhook_events` e `integration_sync_logs` | Pendente | Necessario definir prazo curto e descarte seguro. |
| O sistema diferencia arquivamento logico de exclusao definitiva | Implementado | O fluxo principal usa `archived_at`; desfazer lote CSV faz exclusao fisica. |
| Existe descarte seguro de exports CSV gerados | Pendente | Nao existe controle tecnico ou procedimento documentado. |

## 7. Exclusao, anonimização e atendimento ao titular

| Controle | Estado atual | Observacao |
|---|---|---|
| O produto consegue arquivar leads | Implementado | Arquivamento via `archived_at`. |
| O produto registra motivo, ator e data de exclusao em trilha dedicada | Pendente | Hoje falta auditoria persistente para exclusao/arquivamento. |
| O sistema suporta exclusao de dados Meta solicitada pelo provedor | Parcial | Remove conexoes e ativos Meta, mas nao apaga leads importados nem logs derivados. |
| Existe fluxo documentado para atender pedido de exclusao/anonimizacao do titular | Pendente | Nao foi encontrada rotina documental completa para leads e historicos. |
| Existe criterio para preservar somente dados minimos por obrigacao legal ou defesa | Pendente | Precisa ser formalizado por tipo de dado e tabela. |

## 8. Integracoes Meta e exclusao de dados

| Controle | Estado atual | Observacao |
|---|---|---|
| Conexao, desconexao e sincronizacao Meta deixam trilha operacional | Implementado | `integration_sync_logs` cobre parte desse fluxo. |
| Importacao manual Meta respeita a organizacao autenticada | Implementado | `organizationId` divergente e rejeitado. |
| Payloads Meta persistidos sao minimizados o suficiente para LGPD | Parcial | Ainda existe retencao de dados estruturados que podem carregar PII livre. |
| Exclusao de dados da Meta remove todos os dados pessoais derivados | Pendente | Leads e `lead_webhook_events` continuam fora do escopo de limpeza atual. |

## 9. Auditoria minima obrigatoria

Eventos que deveriam gerar trilha persistente por organizacao:

| Evento | Estado atual | Observacao |
|---|---|---|
| Login | Pendente | Nao foi encontrada auditoria persistente de autenticacao bem-sucedida ou falha relevante. |
| Conexao Meta | Parcial | Coberto parcialmente por `integration_sync_logs` e fluxo OAuth. |
| Desconexao Meta | Parcial | Coberto parcialmente por `integration_sync_logs`. |
| Sincronizacao Meta | Implementado | Existe log operacional parcial. |
| Importacao CSV | Pendente | Nao existe evento dedicado com ator, lote e contagem. |
| Importacao Meta | Pendente | Nao existe trilha unificada com ator, fonte e resultado consolidado. |
| Exportacao de leads | Pendente | Sem evento de auditoria. |
| Edicao de lead | Pendente | Sem diff, ator e timestamp em tabela de auditoria. |
| Arquivamento/exclusao de lead | Pendente | Sem trilha persistente dedicada. |
| Alteracao de permissoes de membros | Pendente | RPCs existem, mas sem log de auditoria encontrado. |
| Convites de equipe | Pendente | Faltam logs persistentes de criacao, aceite e expiracao. |
| Criacao de campanha | Pendente | Campanha e salva, mas nao ha auditoria de acao gerencial separada. |
| Edicao/publicacao/pausa/cancelamento de campanha | Parcial | `meta_campaign_publication_attempts` cobre publicacao na Meta, nao a trilha completa do ciclo da campanha. |
| Alteracao de creditos, compra e plano | Parcial | `credit_transactions`, `billing_purchases` e `payment_events` sao trilhas transacionais, nao uma auditoria geral de governanca. |
| Alteracao de nome comercial e configuracoes sensiveis | Pendente | Sem trilha persistente dedicada. |

## 10. Backlog de remediação prioritária

| Prioridade | Acao recomendada | Motivo |
|---|---|---|
| P0 | Restringir `/dashboard/integracoes/webhook-leads` a managers | Evita exposicao de logs organizacionais e nomes de leads a consultores. |
| P0 | Criar tabela unica de auditoria por organizacao | Necessaria para LGPD, investigacao de incidente e accountability. |
| P0 | Registrar exportacoes de leads | Exportacao e um dos maiores vetores de vazamento de PII. |
| P1 | Registrar importacoes CSV/Meta com ator, origem, volume e resultado | Garante rastreabilidade de entrada de dados pessoais. |
| P1 | Registrar edicao e arquivamento/exclusao de leads com motivo e diff minimo | Necessario para governanca de CRM e investigacao. |
| P1 | Fortalecer `sensitize()` para campos de negocio e arrays Meta | Reduz risco de PII em logs persistidos. |
| P1 | Definir politica de retencao para webhook events, sync logs e exports | Reduz excesso de dados e superficie de incidente. |
| P2 | Formalizar base legal e prova de consentimento por origem de lead | Fecha lacunas de governanca e atendimento ao titular. |
| P2 | Revisar escopo de exclusao do endpoint Meta para dados derivados | Alinha exclusao do provedor com tratamento local do SaaS. |

## Evidencias minimas desta checklist

- `src/lib/leads/repository.server.ts`
- `app/api/leads/export/route.ts`
- `app/dashboard/integracoes/webhook-leads/page.tsx`
- `src/lib/logger.ts`
- `app/api/meta/data-deletion/route.ts`
- `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`
