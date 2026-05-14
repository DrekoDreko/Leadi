# Preparação para Teste de Uso Real - LeadHealth

Este documento orienta o teste de uso da LeadHealth como um vendedor real por 1 dia. O objetivo é identificar fricções no fluxo de trabalho e bugs operacionais.

## 📋 Checklist de Teste (Execução Manual)

Durante o dia de uso, execute as seguintes ações no sistema:

### 1. Gestão de Leads
- [ ] **Cadastrar Leads**: Cadastre manualmente pelo menos 5 leads reais ou semi-reais (ex: empresas que você prospectaria).
- [ ] **Filtrar e Buscar**: Use os filtros de status e a busca por nome/email para localizar leads específicos.
- [ ] **Editar Informações**: Atualize dados de um lead (telefone, email, observações) e salve.

### 2. Comunicação e IA
- [ ] **Gerar Mensagem de WhatsApp**: Entre no detalhe de um lead, vá para a aba de mensagens/WhatsApp e gere uma abordagem personalizada.
- [ ] **Copiar e Enviar**: Tente o fluxo de "Copiar Mensagem" e imagine (ou simule) o envio real. Anote se o botão de "Abrir WhatsApp" funciona como esperado.

### 3. Campanhas e Planejamento
- [ ] **Criar Campanha**: Acesse `/dashboard/campanhas` e crie uma nova campanha de teste (ex: "Prospecção MEI Maio").

### 4. Fluxo de Venda
- [ ] **Mudar Status**: Mova leads entre etapas (ex: de "Novo" para "Em Atendimento" ou "Proposta Enviada").
- [ ] **Registrar Observações**: Adicione notas sobre a conversa com o lead.

---

## 📝 Log de Feedback (Anotar aqui ou no TAREFAS.md)

| Momento | Ação | Problema / Fricção Encontrada | Sugestão de Melhoria |
| :--- | :--- | :--- | :--- |
| Exemplo | Cadastrar Lead | O modal fechou sem avisar se salvou. | Mostrar um toast de sucesso. |
| | | | |

---

## 🛡️ Validação Pós-Teste (Antigravity)

Ao final do dia, eu (Antigravity) executarei os seguintes comandos via MCP Supabase para validar a persistência:

1.  `supabase_select` na tabela `leads` filtrando pela data de hoje.
2.  `supabase_select` na tabela `campaigns` para verificar as novas campanhas.

> [!IMPORTANT]
> Eu não exporei dados pessoais (nomes completos, telefones reais, emails reais) nos meus resumos de validação. Apenas confirmarei a contagem e integridade dos registros.

---

## 🚀 Próximos Passos
1. Execute o dia de uso.
2. Anote os pontos de dor.
3. Me envie o feedback bruto para que eu organize no `TAREFAS.md`.
