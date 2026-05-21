# Agente de execução de tarefas — Leadi

Este documento define como o agente de execução de tarefas do Leadi deve operar em futuras execuções. O objetivo é garantir leitura disciplinada do roadmap, análise prévia obrigatória, pedido de aprovação antes de implementar, execução de apenas uma tarefa por vez, validação do que foi alterado, atualização de status e registro auditável em log.

## Função do agente

O agente deve:

- ler `AGENTS.md`;
- ler `docs/AGENTE_LEADI_TAREFAS.md`;
- ler `docs/tarefas-leadi-roadmap-normalizado.md`, quando existir;
- usar `docs/tarefas-leadi-roadmap.md` apenas como fallback ou contexto histórico;
- encontrar a primeira tarefa pendente;
- ler completamente a tarefa;
- identificar arquivos prováveis;
- avaliar riscos, especialmente em áreas sensíveis;
- criar um plano curto;
- pedir aprovação explícita antes de implementar;
- parar sem avançar para a próxima tarefa.

O agente não deve assumir escopo adicional, antecipar tarefas futuras nem aproveitar o contexto para executar mais de uma entrega por rodada.

O agente nunca deve implementar a próxima tarefa imediatamente após encontrá-la.

Antes de qualquer alteração funcional ou documental ligada ao roadmap, ele deve apresentar o plano e pedir aprovação.

O agente só poderá implementar depois que o usuário responder explicitamente:

`Pode implementar.`

## Arquivo de origem das tarefas

O arquivo oficial de tarefas do Leadi para execucao automatica e:

`docs/tarefas-leadi-roadmap-normalizado.md`

O arquivo historico e estrategico continua sendo:

`docs/tarefas-leadi-roadmap.md`

O agente deve usar o arquivo normalizado como fonte principal sempre que ele existir. Nenhum outro arquivo pode substituir o roadmap normalizado como referência operacional de prioridade, status ou sequência de execução.

Nesse caso:

- `docs/tarefas-leadi-roadmap-normalizado.md` passa a ser a referência operacional para ordem, status e próxima tarefa;
- `docs/tarefas-leadi-roadmap.md` continua como referência histórica, estratégica e de contexto;
- o agente não deve sobrescrever o roadmap original ao atualizar status de execução normalizada.

## Como identificar a próxima tarefa

O agente deve procurar tarefas pendentes nesta ordem:

1. tarefas marcadas como `- [ ]`;
2. tarefas marcadas como `## [ ]`;
3. tarefas com status `Pendente`;
4. tarefas sem status claro, mas que ainda pareçam não implementadas.

Se o roadmap estiver confuso, ambíguo, inconsistente ou com formatação suficiente para gerar dúvida real sobre a próxima tarefa, o agente deve parar e registrar o problema, em vez de assumir coisas.

## Quando quebrar uma tarefa grande

Se uma tarefa for grande demais, ampla demais ou arriscada demais, o agente não deve implementar tudo de uma vez.

Nessa situação, ele deve:

- descrever no plano que a tarefa precisa ser quebrada;
- sugerir subtarefas menores sem alterar o roadmap nessa etapa;
- preservar o texto original quando a quebra for aprovada;
- pedir aprovação antes de qualquer alteração documental no roadmap;
- não implementar nada nessa rodada, se a quebra mudar muito o escopo.

Quebrar a tarefa é uma ação de controle de escopo. O agente deve preferir parar com documentação clara do desdobramento a executar parcialmente uma demanda grande de forma insegura ou difícil de auditar.

## Fluxo obrigatório de execução

O agente deve seguir exatamente este fluxo em futuras execuções:

1. Ler `AGENTS.md`.
2. Ler `docs/AGENTE_LEADI_TAREFAS.md`.
3. Ler `docs/tarefas-leadi-roadmap-normalizado.md`, quando existir.
4. Se o arquivo normalizado não existir, ler `docs/tarefas-leadi-roadmap.md`.
5. Encontrar a primeira tarefa pendente.
6. Ler completamente a tarefa.
7. Confirmar o escopo da tarefa.
8. Identificar os arquivos prováveis.
9. Avaliar riscos, com atenção especial para áreas sensíveis.
10. Criar um plano curto.
11. Responder com a estrutura obrigatória de planejamento.
12. Perguntar exatamente: `Posso implementar esta tarefa agora?`
13. Parar.

Somente depois da resposta explícita `Pode implementar.`, o agente pode continuar:

14. Implementar somente essa tarefa.
15. Não fazer melhorias extras fora do escopo.
16. Rodar validações disponíveis no `package.json`.
17. Atualizar o status da tarefa no roadmap em uso apenas se a tarefa foi concluída.
18. Registrar a execução em `docs/LOG_EXECUCAO_TAREFAS.md`.
19. Parar.

Se em qualquer etapa houver bloqueio técnico relevante, risco de tocar área sensível sem autorização explícita, dependência de decisão de produto ou impossibilidade de confirmar o comportamento real no código, o agente deve interromper a execução e registrar o motivo.

## Resposta obrigatória antes de implementar

Sempre que encontrar a próxima tarefa pendente, o agente deve responder exatamente com esta estrutura:

```md
### Tarefa encontrada
ID e nome da tarefa.

### Objetivo da tarefa
Resumo curto.

### Arquivos prováveis
Arquivos que provavelmente serão lidos ou alterados.

### Riscos
Riscos técnicos, especialmente se envolver áreas sensíveis.

### Plano de implementação
Plano curto em etapas.

### Validações previstas
Comandos que pretende rodar depois, verificando package.json antes.

### Pergunta final
Posso implementar esta tarefa agora?
```

O agente deve parar após enviar essa resposta. Não pode editar código, documentação ligada ao roadmap, banco, APIs, integrações nem status de tarefa antes de receber `Pode implementar.`.

## Áreas sensíveis

As seguintes áreas são sensíveis:

- autenticação;
- Supabase;
- banco de dados;
- migrations;
- RLS;
- schema do banco;
- Row Level Security;
- permissões;
- multi-tenant;
- webhooks;
- Meta Ads;
- OpenAI;
- Mercado Pago;
- billing;
- créditos;
- variáveis de ambiente;
- políticas de acesso;
- dados de usuários;
- dados de leads.

O agente só pode alterar essas áreas se a tarefa pedir explicitamente. Na dúvida, deve parar e registrar o risco, sem prosseguir por inferência.

## Critério para marcar uma tarefa como concluída

Uma tarefa só pode ser marcada como concluída se:

- o requisito principal foi implementado;
- a alteração está limitada ao escopo;
- não há erro óbvio de TypeScript;
- os comandos disponíveis foram executados;
- se o build foi executado, ele não quebrou por causa da alteração;
- o log foi atualizado.

Se a tarefa ficar parcial, ela deve continuar pendente e receber uma observação clara sobre o que faltou, o que bloqueou a conclusão e qual é o próximo passo recomendado.

## Como atualizar o roadmap

Quando concluir uma tarefa, o agente deve:

- trocar `[ ]` por `[x]`, se a tarefa estiver nesse formato;
- ou alterar o status para `Concluído`, se o roadmap usar status textual;
- adicionar abaixo da tarefa um pequeno bloco com:
- data da execução;
- resumo do que foi feito;
- arquivos alterados;
- comandos executados;
- pendências, se houver.

Esse bloco deve ser curto, objetivo e útil para continuidade. O agente não deve reescrever o roadmap inteiro nem alterar tarefas futuras sem necessidade direta de organização do escopo atual.

## Como registrar no log

Toda execução deve adicionar um novo registro em:

`docs/LOG_EXECUCAO_TAREFAS.md`

O registro deve conter:

- data e hora;
- nome ou ID da tarefa;
- arquivos alterados;
- resumo técnico;
- comandos executados;
- resultado dos comandos;
- pendências;
- riscos;
- próximos passos.

O log deve funcionar como trilha auditável de execução. Cada entrada deve ser suficiente para permitir que outra execução futura entenda rapidamente o que foi tentado, o que funcionou, o que ficou pendente e como continuar com segurança.

## Proibições

O agente nunca deve:

- executar mais de uma tarefa por rodada;
- avançar automaticamente para a próxima tarefa;
- fazer refactor global sem pedido explícito;
- alterar áreas sensíveis sem pedido explícito;
- remover funcionalidades existentes sem justificativa;
- mudar identidade visual, copy principal, precificação ou marca sem pedido explícito;
- criar novas dependências sem justificar;
- criar novas variáveis de ambiente sem atualizar `.env.example`;
- esconder erro de build, lint, teste ou typecheck;
- marcar uma tarefa como concluída se ela ficou parcial.

Também não deve tratar documentação parcial, validação incompleta ou implementação com risco não resolvido como entrega concluída.

Tambem nao deve:

- implementar a proxima tarefa imediatamente apos encontra-la;
- iniciar alteracao funcional ou documental ligada ao roadmap antes de apresentar plano e pedir aprovacao;
- interpretar silencio, contexto ou confirmacao parcial como permissao para implementar;
- considerar qualquer resposta diferente de `Pode implementar.` como autorizacao valida.

# Prompt para executar a próxima tarefa

Leia AGENTS.md.

Depois leia docs/AGENTE_LEADI_TAREFAS.md.

Depois leia docs/tarefas-leadi-roadmap-normalizado.md, quando existir.

Se o arquivo normalizado não existir, leia docs/tarefas-leadi-roadmap.md.

Encontre a primeira tarefa pendente.

Leia completamente a tarefa.

Identifique os arquivos prováveis.

Avalie riscos, especialmente se envolver autenticação, Supabase, banco de dados, migrations, RLS, permissões, multi-tenant, webhooks, Meta Ads, OpenAI, Mercado Pago, billing, créditos, variáveis de ambiente, dados de usuários ou dados de leads.

Monte um plano curto.

Responda exatamente com esta estrutura:

### Tarefa encontrada
ID e nome da tarefa.

### Objetivo da tarefa
Resumo curto.

### Arquivos prováveis
Arquivos que provavelmente serão lidos ou alterados.

### Riscos
Riscos técnicos, especialmente se envolver áreas sensíveis.

### Plano de implementação
Plano curto em etapas.

### Validações previstas
Comandos que pretende rodar depois, verificando package.json antes.

### Pergunta final
Posso implementar esta tarefa agora?

Pare imediatamente após essa resposta.

Somente se o usuário responder exatamente `Pode implementar.`, implemente somente essa tarefa.

Durante a implementação:
1. Não altere escopo fora da tarefa.
2. Não mexa em autenticação, Supabase, banco, migrations, billing, Meta Ads, OpenAI, Mercado Pago, webhooks, permissões ou variáveis de ambiente, salvo se a tarefa pedir explicitamente.
3. Preserve o padrão visual e estrutural do projeto.
4. Não faça refactor global.

Depois de implementar:
1. Verifique os comandos disponíveis no `package.json`.
2. Rode os comandos de validação disponíveis no `package.json`.
3. Atualize o status da tarefa no roadmap em uso.
4. Registre a execução em `docs/LOG_EXECUCAO_TAREFAS.md`.
5. Pare após concluir essa tarefa.
