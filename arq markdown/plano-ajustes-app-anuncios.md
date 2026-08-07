# Plano de ajustes — App de criação de anúncios Meta para corretores de plano de saúde

> **Para o Claude no VS Code:** este documento descreve mudanças a serem feitas em um app existente que cria e gerencia campanhas no Meta Ads via Marketing API, em nome de corretores de plano de saúde. Leia a seção "Evidência" para entender o porquê de cada mudança — ela vem de dados reais de produção, não de suposições. Antes de escrever código, leia o repositório e confirme as suposições listadas em "Suposições a validar no código".

---

## 1. Contexto

O app permite que um corretor de plano de saúde crie e publique campanhas no Meta sem entrar no Gerenciador de Anúncios. Ele monta a estrutura completa (campanha → conjunto → anúncio → criativo) e publica via Marketing API.

Três campanhas foram publicadas pelo app em produção. **Nenhuma gerou um único lead.** Duas delas praticamente não entregaram. A causa não está no criativo — está na arquitetura de campanha que o app gera.

Este documento traduz esse diagnóstico em mudanças concretas de código.

---

## 2. Evidência

### 2.1 As três campanhas geradas pelo app

| # | Campaign ID | Criada em | Status | Orçamento | Gasto | Impressões | Alcance | Freq. | Cliques | CTR | CPC | CPM | **Leads** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `120247402491810743` | 25/06/2026 23:39 | CAMPAIGN_PAUSED | — | R$5,52 | 93 | 90 | 1,03 | 6 | 6,45% | R$0,92 | R$59,35 | **0** |
| 2 | `120247503476790743` | 26/06/2026 12:10 | ACTIVE | R$15,00/dia | R$10,84 | 260 | 240 | 1,08 | 5 | 1,92% | R$2,17 | R$41,69 | **0** |
| 3 | `120248825785540743` | 06/08/2026 17:01 | ACTIVE | R$20,00/dia | R$0 | 0 | 0 | 0 | 0 | — | — | — | **0** |

**Total: R$16,36 gastos, 353 impressões, 11 cliques, 0 leads.**

O dado mais grave é a campanha #2: ficou **ativa por ~6 semanas com R$15/dia disponíveis** (orçamento potencial de ~R$615) e gastou **R$10,84**. Isso é 1,8% do orçamento. Ela não está pausada nem bloqueada — o Meta simplesmente não está entregando.

### 2.2 Configuração que o app gera (idêntica nas três)

```
campaign:
  objective:            OUTCOME_LEADS
  buying_type:          AUCTION
  bid_strategy:         LOWEST_COST_WITHOUT_CAP  ("Highest volume")
  daily_budget:         R$15–20  (orçamento no nível de campanha / CBO)

adset:
  optimization_goal:    LEAD_GENERATION
  attribution_setting:  1d_view_7d_click
  destino:              Formulário Instantâneo do Meta
                        (indicador de resultado = actions:leadgen.other)
  targeting:
    age_min: 18, age_max: 65
    geo_locations.cities:
      - Fortaleza (key 253370), raio 25 km
      - Recife    (key 266284), raio 25 km
      - Salvador  (key 267730), raio 25 km
    location_types: [home, recent]
    targeting_optimization: expansion_all
    targeting_automation.advantage_audience: 1
    publisher_platforms: [facebook, instagram, audience_network]
    audience_network_positions: [classic, rewarded_video]

ad / creative:
  object_type:          SHARE
  call_to_action_type:  SEE_DETAILS
```

**Estrutura:** cada publicação cria uma campanha nova, com um conjunto novo e um anúncio novo. Nunca reaproveita nada.

**Conta de anúncios:** zero datasets (nenhum pixel, nenhuma CAPI configurada).

### 2.3 Diagnóstico raiz

O conjunto otimiza para `LEAD_GENERATION`. O Meta exige aproximadamente **50 conversões por conjunto por semana** para sair da fase de aprendizado. Com 0 leads desde 26/06, o conjunto nunca saiu do aprendizado. Fora do aprendizado bem-sucedido, o algoritmo não tem sinal de para quem entregar, então restringe a entrega drasticamente.

Isso fecha um ciclo:

```
sem leads → sem sinal de conversão → entrega estrangulada
    → menos impressões → menos chance de lead → sem leads
```

E o orçamento torna o ciclo inescapável por construção. Com CPL realista de R$25–60 para plano de saúde empresarial, R$15/dia compra entre 0,25 e 0,6 lead/dia — no melhor caso ~4 leads/semana contra as ~50 necessárias. **A configuração que o app gera é matematicamente incapaz de sair da fase de aprendizado.**

O CTR de 1,92% e 6,45% em público frio B2B é aceitável. A geração de criativo não é o gargalo. O gargalo é a arquitetura de campanha.

---

## 3. Suposições a validar no código

Antes de implementar, confirme lendo o repositório:

1. Onde fica a montagem do payload de campanha/conjunto/anúncio enviado à Marketing API.
2. Se os valores em 2.2 são **hardcoded**, vêm de um template/preset, ou são escolhidos pelo corretor na UI. A resposta muda onde cada correção entra.
3. Se existe alguma persistência de campanhas já criadas por corretor (tabela de campanhas, mapeamento corretor → campaign_id). Isso é pré-requisito da Mudança 2.
4. Se existe algum job agendado / cron no projeto. Isso é pré-requisito da Mudança 7.
5. Qual versão da Marketing API está em uso.
6. Como o formulário instantâneo (lead form) é criado ou referenciado hoje.

Se qualquer uma dessas suposições estiver errada, pare e reporte antes de seguir.

---

## 4. Mudanças a implementar

Estão em ordem de impacto. As mudanças 1, 2 e 3 resolvem a causa raiz; as demais são correções de qualidade importantes mas secundárias.

---

### Mudança 1 — Escolher `optimization_goal` em função do orçamento

**Problema:** o app sempre usa `LEAD_GENERATION`, inclusive em orçamentos onde isso garante que a campanha não entrega.

**Regra a implementar:**

Calcular o piso de orçamento diário necessário para sair do aprendizado:

```
piso_diario = cpl_alvo * 50 / 7
```

Onde `cpl_alvo` é informado pelo corretor (novo campo na UI: "Quanto vale um lead para você?"). Se não informado, usar R$40 como padrão para plano de saúde empresarial.

Então:

- **Se `orcamento_diario >= piso_diario`** → usar `optimization_goal: LEAD_GENERATION`.
- **Se `orcamento_diario < piso_diario`** → usar `optimization_goal: LANDING_PAGE_VIEWS` (ou `LINK_CLICKS` se o destino for formulário instantâneo e LPV não se aplicar). O formulário continua sendo o destino e os leads continuam sendo capturados — muda apenas o evento que o algoritmo persegue, que passa a ser barato o bastante para acumular volume e sair do aprendizado.
- **Migração automática:** quando um conjunto rodando em modo degradado acumular 50+ leads em 7 dias, sugerir ao corretor migrar aquele conjunto para `LEAD_GENERATION`.

**Na UI:** ao detectar orçamento abaixo do piso, exibir explicitamente, sem jargão:

> Com R$15/dia, o Meta não recebe conversões suficientes para aprender quem é seu público. Vamos otimizar por cliques qualificados em vez de leads — você continua recebendo os leads pelo formulário. Para otimizar direto por lead, o orçamento precisaria ser de ~R$285/dia.

**Critério de aceite:**
- Campanha criada com R$15/dia e CPL alvo R$40 sai com `optimization_goal` diferente de `LEAD_GENERATION`.
- Campanha criada com R$300/dia e CPL alvo R$40 sai com `LEAD_GENERATION`.
- O aviso aparece na UI antes da publicação, não depois.

---

### Mudança 2 — Reutilizar campanha e conjunto em vez de criar novos

**Problema:** cada publicação cria campanha + conjunto + anúncio novos. Isso zera o aprendizado a cada publicação e fragmenta o orçamento entre estruturas concorrentes. Os R$16 gastos viraram três sinais mortos em vez de um sinal acumulado.

**Regra a implementar:**

Ao publicar, procurar uma campanha existente do corretor que tenha:
- mesmo `objective`
- mesma configuração de geo (mesmo conjunto de cidades)
- status ativo

Se encontrar:
- **Padrão:** criar apenas um `ad` novo dentro do conjunto existente. Não criar campanha nem conjunto.
- Oferecer na UI a opção "criar campanha separada", mas **não** como padrão, e com aviso de que isso reinicia o aprendizado.

Se não encontrar, criar a estrutura completa como hoje e persistir o `campaign_id` / `adset_id` para as próximas publicações.

**Critério de aceite:**
- Publicar dois criativos seguidos para a mesma praça resulta em 1 campanha, 1 conjunto, 2 anúncios.
- O `campaign_id` reutilizado é persistido e recuperável por corretor + praça.

---

### Mudança 3 — Bloquear campanhas duplicadas concorrentes

**Problema:** o app deixou duas campanhas ativas com mesmo objetivo, mesma otimização, mesma faixa etária e as mesmas três cidades. Elas disputam o mesmo leilão pelo mesmo público, encarecendo o CPM de ambas.

**Regra a implementar:**

Checagem pré-publicação. Se já existir campanha **ativa** do mesmo corretor com:
- mesmo `objective`, **e**
- interseção de `geo_locations`, **e**
- interseção de faixa etária

então bloquear a publicação e apresentar duas saídas:
1. Adicionar o criativo à campanha existente (caminho da Mudança 2 — este deve ser o botão primário).
2. Pausar a campanha antiga e publicar a nova.

Nunca publicar as duas em paralelo silenciosamente.

**Critério de aceite:**
- Tentar publicar uma campanha idêntica a uma já ativa dispara o bloqueio com as duas opções.
- Praças sem interseção (ex.: Fortaleza vs. Curitiba) não disparam o bloqueio.

---

### Mudança 4 — Corrigir posicionamentos padrão

**Problema:** `audience_network_positions` inclui `rewarded_video` — posicionamento em que o usuário clica para ganhar recompensa dentro de um app ou jogo. É o pior tráfego possível para um formulário B2B, e provavelmente responde por parte dos 11 cliques que não viraram lead.

**Regra a implementar:**

Para objetivo de lead, o padrão passa a ser:

```
publisher_platforms: [facebook, instagram]
```

Remover `audience_network` do padrão. Se optar por manter a rede como opção avançada, remover ao menos `rewarded_video` de forma incondicional.

**Critério de aceite:**
- Nova campanha de lead sai sem `audience_network` em `publisher_platforms`.
- Não existe caminho na UI que produza `rewarded_video` em campanha de lead.

---

### Mudança 5 — Corrigir o CTA padrão

**Problema:** o criativo usa `call_to_action_type: SEE_DETAILS`. Para captação de lead esse CTA é fraco e desalinhado com a promessa do formulário.

**Regra a implementar:**

Para objetivo de lead, usar `GET_QUOTE` como padrão (é o que mais se alinha a "cotação de plano empresarial"). Alternativas aceitáveis a expor na UI: `SIGN_UP`, `APPLY_NOW`, `LEARN_MORE`. Remover `SEE_DETAILS` das opções para esse objetivo.

**Critério de aceite:** nova campanha de lead sai com `GET_QUOTE` salvo escolha explícita do corretor entre as alternativas permitidas.

---

### Mudança 6 — Públicos personalizados a partir da carteira do corretor

**Problema:** o targeting atual é 18–65, população geral de três capitais, com `advantage_audience: 1` e `targeting_optimization: expansion_all`. Para um produto B2B, isso entrega a qualquer pessoa. E sem sinal de conversão, o Advantage Audience não tem do que aprender — ele amplifica um sinal que não existe.

**Oportunidade:** todo corretor já tem carteira de clientes. Esse é o ativo de targeting mais forte disponível nesse nicho, e está sendo ignorado.

**Regra a implementar:**

Novo fluxo no app:
1. Corretor faz upload da carteira (CSV com e-mail, telefone, e o que mais tiver).
2. App faz o hashing dos identificadores conforme exigido pela API e cria um Custom Audience (`subtype: CUSTOM`).
3. App cria um Lookalike a partir dele (`subtype: LOOKALIKE`, faixa de 1–3%), restrito às praças da campanha.
4. Campanhas novas passam a usar o Lookalike como público, em vez de targeting aberto.

Manter o targeting aberto apenas como fallback para corretor sem carteira carregada.

**Atenção:** dados de clientes exigem hashing local antes do envio e consentimento adequado. Não persistir o CSV cru; processar e descartar.

**Critério de aceite:**
- Upload de carteira gera Custom Audience e Lookalike associados ao corretor.
- Campanha nova de corretor com carteira usa o Lookalike no `targeting`.

---

### Mudança 7 — Monitoramento de entrega pós-publicação

**Problema:** a campanha #2 ficou 6 semanas gastando 1,8% do orçamento e ninguém percebeu. O corretor não tem como perceber isso sozinho — no painel a campanha aparece como "ativa".

**Regra a implementar:**

Job diário que, para cada campanha ativa, compara gasto real com gasto esperado:

```
taxa_entrega = gasto_ontem / orcamento_diario
```

Alertas:
- `taxa_entrega < 0.30` por 3 dias seguidos → alerta de subentrega no painel e por e-mail/WhatsApp, com diagnóstico em linguagem simples e ação sugerida.
- Campanha ativa há 7+ dias com 0 leads → alerta separado.
- Frequência acima de 3 → alerta de saturação de público.

O texto do alerta deve dizer o que fazer, não só que algo está errado. Exemplo:

> Sua campanha gastou R$0,26 dos R$15,00 previstos ontem. Isso normalmente significa que o Meta ainda não aprendeu quem é seu público. Sugestão: ampliar as cidades ou aumentar o orçamento para R$X/dia.

**Critério de aceite:**
- Job roda diariamente e persiste histórico de entrega por campanha.
- Uma campanha em subentrega gera exatamente um alerta, não um por dia.

---

### Mudança 8 — Onboarding de pixel / dataset

**Problema:** a conta não tem nenhum dataset. O formulário instantâneo funciona sem pixel, então nada quebra hoje — mas sem pixel o corretor nunca terá retargeting de visitantes do site, lookalike de quem converteu, nem medição do que acontece depois do lead.

**Regra a implementar:**

Passo de onboarding que detecta ausência de dataset na conta e guia a criação, explicando o ganho em termos práticos ("permite anunciar de novo para quem já visitou seu site"). Não bloquear a publicação por causa disso — é melhoria, não pré-requisito.

**Critério de aceite:** app detecta `datasets: []` e exibe o passo de onboarding uma vez, com opção de dispensar.

---

### Mudança 9 — Revisar o formulário instantâneo (investigar antes de mexer)

**Observação:** 11 cliques resultaram em 0 preenchimentos. Formulários B2B que pedem CNPJ, número de vidas e telefone logo de cara derrubam a conversão.

**Ressalva importante:** 11 cliques é amostra pequena demais para concluir qualquer coisa. Com taxa de preenchimento típica de 10–20%, 0 de 11 está dentro do azar normal. **Não refaça o formulário com base nesse número.**

**O que fazer:** instrumentar antes de decidir. Registrar aberturas de formulário vs. envios, para que exista base real quando o volume aparecer. Só então revisar os campos.

---

## 5. Ordem sugerida de implementação

1. **Mudanças 1, 2 e 3** — resolvem a causa raiz. Sem elas, nenhuma outra importa.
2. **Mudanças 4 e 5** — baratas, isoladas, ganho imediato de qualidade de tráfego.
3. **Mudança 7** — dá visibilidade para validar se 1–3 funcionaram.
4. **Mudança 6** — maior esforço, maior ganho de longo prazo.
5. **Mudanças 8 e 9** — melhorias de base.

---

## 6. Ação imediata, fora do código

Independente das mudanças acima, na conta de produção:

- Pausar a campanha `120247503476790743` (26/06). Ela está travada em aprendizado há 6 semanas e só está competindo com a campanha nova.
- Deixar apenas `120248825785540743` (06/08) rodando, para servir de linha de base limpa depois dos ajustes.

---

## 7. Como saber se funcionou

Depois de implantar as mudanças 1–5, a próxima campanha publicada deve apresentar, em 7 dias:

- **Taxa de entrega acima de 80%** do orçamento diário (hoje: 1,8%).
- **Volume de impressões pelo menos 20× maior** para o mesmo gasto proporcional.
- Frequência entre 1 e 3.
- Pelo menos algum lead. Se a entrega normalizar e ainda assim vierem zero leads com volume real, aí sim o problema passa a ser criativo ou formulário — e a investigação recomeça com dados que valem alguma coisa.
