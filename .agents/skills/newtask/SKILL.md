---
name: newtask
description: Use esta skill quando o usuário digitar /newtask, $newtask, pedir para iniciar a próxima tarefa do roadmap, ou pedir para planejar a próxima implementação do Leadi sem executar ainda.
---

# Função da skill

Esta skill serve para preparar a próxima tarefa do roadmap do SaaS Leadi, sem implementar imediatamente.

Ela deve trabalhar sempre em modo planejamento.

## Arquivos que a skill deve ler

1. `AGENTS.md`
2. `docs/AGENTE_LEADI_TAREFAS.md`
3. `docs/tarefas-leadi-roadmap-normalizado.md`

## Regras obrigatórias

- Não implementar nada na primeira resposta.
- Não alterar arquivos.
- Não atualizar roadmap.
- Não atualizar log.
- Não rodar build, lint ou test.
- Não avançar para outra tarefa.
- Apenas encontrar a primeira tarefa pendente e montar o plano.
- Sempre perguntar autorização antes de implementar.

## Como encontrar a próxima tarefa

Use o roadmap normalizado como fonte principal.

Procure a primeira tarefa pendente nesta ordem:

1. tarefas marcadas como `- [ ]`;
2. tarefas marcadas como `## [ ]`;
3. tarefas com status `Pendente`;
4. tarefas sem status claro, mas que ainda pareçam não implementadas.

Se o roadmap estiver confuso, ambíguo ou inconsistente a ponto de impedir a identificação segura da próxima tarefa, pare e explique o bloqueio em vez de assumir algo.

## Estrutura obrigatória da resposta

A resposta da skill deve seguir exatamente este formato:

```md
### Tarefa encontrada
Informar ID e nome da primeira tarefa pendente.

### Objetivo da tarefa
Explicar em poucas linhas o que será feito.

### Arquivos prováveis
Listar os arquivos que provavelmente serão lidos ou alterados.

### Riscos
Listar riscos técnicos, especialmente se envolver:

autenticação;
Supabase;
banco de dados;
migrations;
RLS;
permissões;
multi-tenant;
webhooks;
Meta Ads;
OpenAI;
Mercado Pago;
billing;
créditos;
variáveis de ambiente;
dados de usuários;
dados de leads.

### Plano de implementação
Criar um plano objetivo, em etapas pequenas.

### Validações previstas
Dizer quais comandos pretende rodar depois, verificando antes o package.json.

### Pergunta final
Posso implementar esta tarefa agora?
```

## Regra para implementação posterior

Se o usuário responder exatamente:

`Pode implementar.`

Então o Codex pode implementar somente a tarefa planejada, respeitando:

- `AGENTS.md`;
- `docs/AGENTE_LEADI_TAREFAS.md`;
- escopo da tarefa;
- áreas sensíveis;
- atualização do roadmap;
- registro em `docs/LOG_EXECUCAO_TAREFAS.md`;
- parada após uma única tarefa.

## Restrições permanentes desta skill

- Nunca implementar a próxima tarefa imediatamente após encontrá-la.
- Nunca misturar a tarefa atual com correções paralelas fora do escopo.
- Nunca alterar autenticação, Supabase, banco, billing, integrações, webhooks ou variáveis de ambiente sem autorização explícita da própria tarefa e do usuário.
- Nunca tratar silêncio, contexto ou confirmação parcial como permissão para implementar.

## Comportamento esperado

Quando esta skill for acionada, o agente deve:

1. Ler os três arquivos obrigatórios.
2. Encontrar a primeira tarefa pendente.
3. Ler a tarefa por completo.
4. Identificar escopo, arquivos prováveis e riscos.
5. Montar um plano curto.
6. Responder no formato obrigatório.
7. Encerrar a resposta com a pergunta exata:

`Posso implementar esta tarefa agora?`
