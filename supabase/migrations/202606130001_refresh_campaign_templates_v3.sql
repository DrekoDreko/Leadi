-- Refresh campaign templates with clearer, ad-oriented copy.
-- Disables old templates and inserts 6 new ones aligned with real campaign scenarios.

update public.system_templates
set is_active = false,
    updated_at = now()
where template_type = 'campaign'
  and is_active = true;

insert into public.system_templates (id, template_type, category, title, description, content, is_active)
values
  (
    'tpl-campaign-revisao-preco',
    'campaign',
    'Revisão de preço',
    'Pagando caro no plano? Migre para PME e economize',
    'Para quem já tem plano individual ou familiar e quer reduzir o custo migrando para um plano empresarial PME.',
    '{
      "audience": "Profissionais autônomos, sócios e famílias que pagam plano individual caro e têm CNPJ ativo (MEI, ME, LTDA) para migrar para PME.",
      "offer": "Comparativo entre o plano atual (individual/familiar) e opções empresariais PME com economia real, mantendo rede e cobertura equivalente.",
      "region": "São Paulo, ABC Paulista, Campinas",
      "differentiator": "Mostra quanto o lead pode economizar saindo do plano pessoa física para o empresarial, sem perder rede nem cobertura.",
      "tone": "Consultivo e direto",
      "notes": "Não prometer percentual exato de economia. Focar no comparativo real entre o valor atual e as opções PME. Usar linguagem de revisão e oportunidade."
    }'::jsonb,
    true
  ),
  (
    'tpl-campaign-mei',
    'campaign',
    'MEI',
    'Plano empresarial para MEI a partir de 2 vidas',
    'MEI pode contratar plano empresarial com preços menores que o individual. Abra sua cotação.',
    '{
      "audience": "Microempreendedores individuais (MEI) com CNPJ ativo que querem plano de saúde para si e familiares a preço empresarial.",
      "offer": "Cotação de plano empresarial PME para MEI com 2 a 4 vidas, comparando operadoras e rede credenciada da região.",
      "region": "São Paulo, Guarulhos, Osasco",
      "differentiator": "Explica que MEI já pode contratar PME, quais documentos são necessários e como incluir dependentes no contrato.",
      "tone": "Humano e claro",
      "notes": "Não prometer aprovação automática. Explicar que a elegibilidade depende da operadora e do tempo de CNPJ. Linguagem acessível."
    }'::jsonb,
    true
  ),
  (
    'tpl-campaign-rede-credenciada',
    'campaign',
    'Rede credenciada',
    'Escolha o plano pelo hospital e rede que você precisa',
    'Compare planos pela rede credenciada: hospitais, laboratórios e clínicas da sua região.',
    '{
      "audience": "Empresas e profissionais que priorizam atendimento em hospitais e laboratórios específicos antes de definir o plano.",
      "offer": "Comparativo de planos por rede credenciada, mostrando quais operadoras atendem nos hospitais e laboratórios desejados.",
      "region": "São Paulo, ABC Paulista, Santos",
      "differentiator": "Parte da rede que o lead precisa e filtra as operadoras por cobertura real na região, ao invés de começar pelo preço.",
      "tone": "Profissional e objetivo",
      "notes": "Não afirmar que todas as operadoras cobrem determinado hospital. Focar em comparação por rede e aderência regional."
    }'::jsonb,
    true
  ),
  (
    'tpl-campaign-primeira-contratacao',
    'campaign',
    'Primeira contratação',
    'Empresa nova? Veja como contratar o primeiro plano',
    'Orientação para empresas que nunca contrataram plano e precisam entender por onde começar.',
    '{
      "audience": "Empresas recém-abertas ou em crescimento que vão contratar plano de saúde empresarial pela primeira vez.",
      "offer": "Orientação completa: documentação necessária, número mínimo de vidas, operadoras disponíveis e prazo de implantação.",
      "region": "São Paulo, Barueri, Alphaville",
      "differentiator": "Traduz o processo de contratação em passos simples para quem nunca fez isso antes, sem jargão técnico.",
      "tone": "Educativo e simples",
      "notes": "Evitar prometer implantação sem análise documental. Focar em orientação, preparo e próximos passos claros."
    }'::jsonb,
    true
  ),
  (
    'tpl-campaign-reajuste',
    'campaign',
    'Reajuste',
    'Reajuste veio alto? Compare e troque de operadora',
    'Para empresas que receberam reajuste acima do esperado e querem avaliar alternativas.',
    '{
      "audience": "Empresas que já têm plano de saúde e receberam reajuste anual alto, buscando alternativas com melhor custo-benefício.",
      "offer": "Análise do reajuste atual com comparativo entre operadoras, considerando rede, carência, portabilidade e coparticipação.",
      "region": "São Paulo, Santos, Interior de SP",
      "differentiator": "Organiza a decisão de troca por rede, carência aproveitada e economia projetada, para o lead decidir com segurança.",
      "tone": "Consultivo e direto",
      "notes": "Não prometer redução garantida de valor. Preferir linguagem de comparação e troca orientada. Explicar portabilidade de carências."
    }'::jsonb,
    true
  ),
  (
    'tpl-campaign-equipe-pequena',
    'campaign',
    'Equipe pequena',
    'Plano de saúde para equipes de 2 a 29 pessoas',
    'Estruture o benefício de saúde da sua equipe com planos empresariais PME acessíveis.',
    '{
      "audience": "Donos e gestores de pequenas empresas que querem oferecer plano de saúde como benefício para reter e atrair talentos.",
      "offer": "Cotação empresarial PME personalizada por número de vidas, região de uso e orçamento disponível da empresa.",
      "region": "Campinas, Jundiaí, Sorocaba",
      "differentiator": "Ajuda a montar o benefício ideal conforme o tamanho da equipe, incluindo sócios, funcionários e dependentes elegíveis.",
      "tone": "Humano e claro",
      "notes": "Evitar urgência artificial ou promessa de menor preço do mercado. Falar em planejamento, composição de vidas e viabilidade."
    }'::jsonb,
    true
  )
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  content = excluded.content,
  is_active = excluded.is_active,
  updated_at = now();

notify pgrst, 'reload schema';
