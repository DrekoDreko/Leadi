# Auditoria de MCPs

Data da auditoria: 2026-05-21

## Resumo
- MCP local encontrado: sim
- MCP global encontrado: sim
- Codex CLI instalado: sim
- Vercel CLI instalado: nao
- Projeto linkado a Vercel: sim
- Supabase detectado: sim
- Project Ref Supabase detectado: sim

## Arquivos analisados
- [package.json](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/package.json)
- [package-lock.json](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/package-lock.json)
- [scripts/supabase-mcp.mjs](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/scripts/supabase-mcp.mjs)
- [docs/mcp-supabase.md](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/docs/mcp-supabase.md)
- [docs/SECURITY_AUDIT.md](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/docs/SECURITY_AUDIT.md)
- [README.md](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/README.md)
- [src/lib/supabase/config.ts](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/src/lib/supabase/config.ts)
- [src/lib/supabase/admin.ts](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/src/lib/supabase/admin.ts)
- [src/lib/env/shared.ts](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/src/lib/env/shared.ts)
- [src/lib/env/server.ts](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/src/lib/env/server.ts)
- [`.env.example`](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/.env.example)
- [`.env.local`](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/.env.local)
- [`.env.production`](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/.env.production)
- [`.vercel/project.json`](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/.vercel/project.json)
- [supabase/migrations](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/supabase/migrations)
- [supabase/.temp/pooler-url](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/supabase/.temp/pooler-url)
- [~/.claude/settings.json](/Users/lucasgomesdreko/.claude/settings.json)
- [~/Library/Application Support/Code/User/settings.json](/Users/lucasgomesdreko/Library/Application%20Support/Code/User/settings.json)
- [~/Library/Application Support/Antigravity/User/settings.json](/Users/lucasgomesdreko/Library/Application%20Support/Antigravity/User/settings.json)

## MCPs encontrados
- `supabase` (Codex global): ativo, transport `stdio`, comando `node`, apontando para [scripts/supabase-mcp.mjs](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/scripts/supabase-mcp.mjs). Escopo global no Codex; nao e read-only e expõe leitura e escrita no Supabase.
- `computer-use` (Codex global): ativo, mas nao relacionado ao projeto.
- Nenhum `.mcp.json` de projeto foi encontrado na arvore do repositório.
- Nenhum MCP da Vercel foi encontrado como configuracao ativa no workspace ou no Codex.

## Vercel
- Existe [`.vercel/project.json`](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/.vercel/project.json).
- `projectId`: `prj_jZgc2TbAwI9gf5hEpIJn2h9MimlK`
- `orgId`: `team_vXnDiKtfsZMDC95as3a40eiT`
- O MCP oficial da Vercel ainda nao esta configurado no Codex.
- O Vercel CLI nao esta instalado localmente, entao `vercel whoami` e `vercel mcp --help` nao puderam ser executados.
- Os docs oficiais da Vercel indicam que o MCP oficial e remoto, com OAuth, e usa o endpoint `https://mcp.vercel.com`.

## Supabase
- O projeto usa Supabase em codigo, documentacao e migracoes.
- Ha migracoes em [supabase/migrations](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/supabase/migrations).
- Ha referencia ao Supabase em [README.md](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/README.md), [src/lib/supabase/config.ts](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/src/lib/supabase/config.ts) e [src/lib/supabase/admin.ts](/Users/lucasgomesdreko/Documents/APP%20META%20+%20CRM/src/lib/supabase/admin.ts).
- O workspace contem `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; o valor da chave nao e registrado aqui.
- O `project_ref` foi inferido com seguranca como `lxjtakbmdwllaeqwhbci`.
- O MCP local atual do projeto nao e read-only: ele expõe `supabase_select`, `supabase_insert`, `supabase_update` e `supabase_delete`.
- Para uso oficial e seguro, o MCP da Supabase deve comecar em modo read-only e escopado por `project_ref`.

## Riscos
- Risco alto de exposicao de secrets: ha `SUPABASE_SERVICE_ROLE_KEY` no workspace.
- Risco alto de escrita acidental no banco via MCP local atual, porque ele aceita insert, update e delete.
- Risco medio de um MCP global afetar projetos errados, ja que o `codex mcp list` e compartilhado no ambiente local.
- Risco medio/alto de conectar o projeto Vercel errado via OAuth se a autorizacao for feita sem checar o `projectId` e o `orgId`.
- Risco alto de o Codex alterar infraestrutura sem aprovacao explicita se um MCP com escrita ficar como padrao.

## Recomendacao
- Manter o MCP local atual apenas para tarefas controladas e nao como padrao amplo para automacao.
- Adicionar o MCP oficial da Vercel com:

```bash
codex mcp add vercel --url https://mcp.vercel.com
```

- Adicionar o MCP oficial da Supabase em modo leitura e escopo por projeto:

```bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=lxjtakbmdwllaeqwhbci&read_only=true&features=database,docs,development,debugging"
```

- Se fizer sentido criar um `.mcp.json` na raiz depois, usar apenas endpoints remotos e manter a Supabase em `read_only=true`.
- Nao habilitar escrita no Supabase sem aprovacao explicita.

## Comandos Propostos
Nao executados nesta etapa.

```bash
codex mcp add vercel --url https://mcp.vercel.com
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=lxjtakbmdwllaeqwhbci&read_only=true&features=database,docs,development,debugging"
```

## Fontes
- [Vercel MCP docs](https://vercel.com/docs/ai-resources/vercel-mcp)
- [Vercel CLI `vercel mcp`](https://vercel.com/docs/cli/mcp)
- [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp)
