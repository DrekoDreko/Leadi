# Orientação de Backup e Proteção de Dados

Este documento descreve como proteger os dados de produção do LeadHealth, detalhando as opções de backup, exportação e os cuidados necessários antes de operações críticas.

---

## 1. Backups Automáticos (Supabase)

A disponibilidade de backups automáticos depende do plano assinado no Supabase:

- **Plano Free:** **Não possui backups automáticos diários.** É obrigatório realizar exportações manuais antes de qualquer alteração estrutural.
- **Plano Pro:** Realiza backups diários automáticos (retenção de 7 dias). 
- **Point-in-Time Recovery (PITR):** Disponível apenas como *add-on* em planos pagos, permitindo restaurar o banco para qualquer segundo específico no passado.

**Recomendação:** Verifique sempre o status do backup no painel do Supabase em `Database` -> `Backups`.

---

## 2. Exportação Manual de Dados

Sempre que for realizar uma manutenção ou se estiver no plano Free, utilize as seguintes opções:

### A. Exportação SQL (Estrutura e Dados)
A forma mais completa de backup manual.
1. Acesse o **Supabase Dashboard**.
2. Vá em **Database** -> **Backups**.
3. Se disponível, clique em **Download Backup**.
4. *Alternativa CLI:* Caso tenha o cliente `pg_dump` instalado localmente:
   ```bash
   pg_dump -h db.YOUR_PROJECT.supabase.co -U postgres > backup_v1.sql
   ```

### B. Exportação CSV (Leads e Tabelas Críticas)
Para garantir que os dados de negócio (Leads) estão seguros de forma legível:
1. Vá em **Table Editor**.
2. Selecione a tabela `leads` (ou outra tabela importante).
3. Clique em **Export CSV** no canto superior direito.
4. Repita para `organizations`, `workspaces` e `campaigns`.

### C. Consultas e Snapshots via MCP Supabase
O [MCP Supabase](./mcp-supabase.md) pode ser usado para extrair snapshots rápidos de validação:
- Use `supabase_select` para capturar os últimos registros antes de uma alteração.
- O resultado pode ser salvo como um "ponto de controle" em arquivo local se necessário.

---

## 3. Cuidados Antes de Migrations

Nunca aplique uma migration em produção sem seguir este fluxo:

1. **Local/Staging:** Valide a migration em ambiente local ou de testes.
2. **Backup:** Confirme que existe um backup automático recente ou realize um manual (SQL ou CSV).
3. **Verificação de Acessos:** Garanta que as variáveis `SUPABASE_SERVICE_ROLE_KEY` estão seguras e configuradas apenas onde necessário.
4. **Comunicação:** Se a alteração for causar downtime ou travar tabelas (ex: `ALTER TABLE`), avise a equipe.

---

## 4. Checklist Pré-Migration (Produção)

Antes de rodar `supabase db push` ou colar SQL no Editor:

- [ ] Realizei backup manual (Download SQL ou CSV das tabelas afetadas).
- [ ] A migration foi testada localmente sem erros.
- [ ] Verifiquei se a migration é destrutiva (`DROP COLUMN`, `DELETE`, etc). Se sim, redobre a atenção.
- [ ] Tenho o [MCP Supabase](./mcp-supabase.md) pronto para validar o estado pós-deploy.
- [ ] (Opcional) Executei `supabase_status` via MCP para garantir que a conexão está ativa.

---

## 5. Como Restaurar

Em caso de falha crítica:

1. **Backups Automáticos (Pro):** Use a interface do Supabase em `Database` -> `Backups` -> `Restore`. Note que isso pode sobrescrever dados novos inseridos após o backup.
2. **Manual SQL:**
   - Se for uma tabela específica, use o SQL Editor para rodar o script de recuperação.
   - Se for o banco todo, utilize a CLI ou o suporte do Supabase se o projeto estiver travado.

> **Aviso:** A restauração de banco de dados é uma operação destrutiva para os dados atuais. Sempre tente recuperar dados específicos via SQL antes de optar por um "Full Restore".
