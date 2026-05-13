# Matriz de Decisão: Evolução da Publicação Meta Ads

Este documento define os critérios e o roteiro técnico para evoluir a funcionalidade de campanhas no LeadHealth, saindo de rascunhos locais para a publicação direta via Meta Marketing API.

## 1. Comparativo de Estados de Publicação

| Característica | Rascunho Local | Rascunho Enviado (Pausado) | Publicação Controlada |
| :--- | :--- | :--- | :--- |
| **Onde reside** | Apenas Banco LeadHealth | Meta Ads Manager | Meta Ads Manager |
| **Status na Meta** | Inexistente | `PAUSED` | `ACTIVE` / `SCHEDULED` |
| **Interação Técnica** | Nenhuma (Offline) | Graph API (`POST`) | Graph API (`POST`) |
| **App Review** | Não necessário | **Obrigatório** | **Obrigatório** |
| **Risco de Erro** | Zero | Baixo (Estrutura) | Médio (Financeiro/Policy) |
| **Valor p/ Usuário** | Organização inicial | Validação de estrutura | Agilidade e Automação |

---

## 2. Requisitos Técnicos e Permissões

Para avançar além do rascunho local, o LeadHealth precisa cumprir as seguintes exigências da Meta:

### Permissões de API (Scope)
- **`ads_management`**: Necessária para criar Campanhas, AdSets e Ads.
- **`ads_read`**: Para validar se os ativos foram criados corretamente.
- **`pages_read_engagement`**: Para listar as páginas do cliente.
- **`leads_retrieval`**: Para capturar leads do formulário após a publicação.

### Processo Institucional
1. **Verificação de Empresa (Business Verification)**: A organização LeadHealth deve comprovar existência legal no Facebook Business Suite.
2. **App Review**: Submissão de screencasts e justificativas de uso para cada permissão solicitada.
3. **Termos de Política**: O app deve estar em conformidade com as Políticas de Publicidade da Meta (especialmente sensível para o setor de Saúde/Seguros).

---

## 3. Análise de Riscos e Custos

| Tipo | Descrição | Impacto |
| :--- | :--- | :--- |
| **Risco de Policy** | Anúncios de saúde/seguros são monitorados rigidamente. IA pode gerar textos proibidos. | Bloqueio da Ad Account do cliente. |
| **Custo de Dev** | Manutenção de versões da Graph API (mudanças trimestrais). | Esforço técnico contínuo. |
| **Risco Financeiro** | Bug na definição de orçamento (ex: R$ 1000/dia em vez de R$ 10). | Prejuízo real para o cliente e responsabilidade legal. |
| **Latência** | Upload de imagens/vídeos via API pode falhar ou demorar. | UX frustrante se não houver feedback claro. |

---

## 4. Matriz de Decisão (Quando Evoluir?)

| Se o cenário for... | Recomenda-se... | Justificativa |
| :--- | :--- | :--- |
| **Ambiente de Teste / Alpha** | **Rascunho Local** | Focar no refinamento do criativo via IA sem burocracia de API. |
| **App Review em Progresso** | **Rascunho Local** | Limitação técnica imposta pela Meta. |
| **Primeira Campanha do Usuário**| **Rascunho Enviado (Pausado)** | O usuário ganha confiança ao ver o rascunho "montado" no Gerenciador de Anúncios. |
| **Campanhas Recorrentes** | **Publicação Controlada** | Reduz o "copy-paste" manual e profissionaliza a operação. |
| **Uso de IA Generativa** | **Rascunho Enviado (Pausado)** | Exige revisão humana final obrigatória para evitar banimentos por política. |

---

## 5. Roadmap de Evolução Proposto

### Fase 1: Rascunho Inteligente (Atual)
- O LeadHealth gera o criativo (texto/imagem).
- Salva no banco de dados local.
- Fornece botão "Copiar Dados" ou link direto para o Gerenciador de Anúncios.

### Fase 2: Sincronização de Ativos (Leitura)
- Implementar listagem de `AdAccounts` e `Pages` reais via OAuth.
- Associar o rascunho local a uma conta real, preparando o terreno para a API.

### Fase 3: Publicação em Pausa (Escrita Segura)
- Criar endpoint `POST /api/campaigns/publish-draft`.
- Criar a estrutura na Meta com status `PAUSED`.
- Notificar o usuário: "Sua campanha foi montada na Meta. Vá ao Gerenciador para ativar."

### Fase 4: Automação de Ciclo Fechado (Escrita Ativa)
- Publicação direta como `ACTIVE` após checklist de segurança.
- Dashboard de performance integrando dados da Meta (impressões, cliques, custo por lead) com o status do CRM (leads convertidos).

---

## Recomendação Final

**Não publique campanhas "Ativas" (`ACTIVE`) de forma automatizada no estágio atual.**

1. Foque em **Rascunho Local** até que o Business Verification e o App Review sejam aprovados.
2. Evolua para **Rascunho Enviado (Pausado)** como padrão de segurança para 90% dos usuários.
3. Reserve a **Publicação Controlada** (Ativa) apenas para usuários com histórico de conta saudável e após validação manual do criativo.
