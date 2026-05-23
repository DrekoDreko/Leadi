-- Replace legacy campaign examples with Meta-safe consultative templates.

update public.system_templates
set is_active = false,
    updated_at = now()
where template_type = 'campaign'
  and title in (
    'Plano de Saude para MEI - Vantagens Exclusivas',
    'Plano de Saúde para MEI - Vantagens Exclusivas',
    'Saude para Pequenas e Medias Empresas',
    'Saúde para Pequenas e Médias Empresas',
    'Economize no Plano Empresarial Atual'
  );

insert into public.system_templates (template_type, category, title, description, content)
select *
from (
  values
    (
      'campaign',
      'MEI consultivo',
      'Plano PME para MEI com até 4 vidas',
      'Abordagem consultiva para MEIs e pequenos CNPJs que precisam validar elegibilidade antes de cotar.',
      '{
        "audience": "MEIs e pequenos CNPJs com 2 a 4 vidas que querem entender se já podem contratar um plano empresarial.",
        "offer": "Análise consultiva para validar elegibilidade, documentação e caminhos de contratação conforme o perfil da empresa.",
        "region": "São Paulo, ABC Paulista",
        "differentiator": "Explica com clareza o que muda entre opções empresariais, documentos exigidos e próximos passos da cotação.",
        "tone": "Humano e claro",
        "notes": "Evitar prometer aprovação imediata ou economia garantida. Convidar o lead para uma análise do perfil."
      }'::jsonb
    ),
    (
      'campaign',
      'Reajuste',
      'Revisão de reajuste do plano atual',
      'Para empresas que já possuem plano e querem revisar reajuste, rede e formato do contrato.',
      '{
        "audience": "Empresas que já têm plano de saúde e querem reavaliar custo, rede credenciada e regras de contratação.",
        "offer": "Revisão consultiva do cenário atual com comparação entre alternativas empresariais aderentes ao perfil da empresa.",
        "region": "São Paulo, Santos, Interior de SP",
        "differentiator": "Organiza a análise por rede, coparticipação, carências e uso esperado antes de sugerir qualquer troca.",
        "tone": "Consultivo e direto",
        "notes": "Não usar promessa de redução garantida. Preferir linguagem de revisão, comparação e tomada de decisão orientada."
      }'::jsonb
    ),
    (
      'campaign',
      'Rede hospitalar',
      'Comparativo por rede e hospital de preferência',
      'Campanha para leads que começam a conversa pela rede credenciada e hospitais prioritários.',
      '{
        "audience": "Empresas e famílias empresariais que priorizam hospitais, laboratórios e região de atendimento antes do preço.",
        "offer": "Comparativo consultivo partindo da rede desejada, da abrangência e do perfil de uso da empresa.",
        "region": "São Paulo, Guarulhos, Osasco",
        "differentiator": "Ajuda o lead a enxergar diferenças reais entre rede, cobertura e aderência ao perfil sem excesso de tecnicismo.",
        "tone": "Profissional e objetivo",
        "notes": "Não depreciar operadoras nem afirmar melhor opção universal. Focar em aderência ao cenário do cliente."
      }'::jsonb
    ),
    (
      'campaign',
      'Pequena equipe',
      'Benefício de saúde para equipes pequenas',
      'Para negócios de 2 a 29 vidas que querem estruturar benefício de forma viável e organizada.',
      '{
        "audience": "Donos e gestores de pequenas empresas que querem oferecer plano para sócios, equipe e dependentes elegíveis.",
        "offer": "Estruturação consultiva de benefício empresarial conforme número de vidas, região de uso e orçamento disponível.",
        "region": "Campinas, Jundiaí, Sorocaba",
        "differentiator": "Ajuda a equilibrar composição de vidas, tipo de cobertura e expectativa financeira sem perder clareza comercial.",
        "tone": "Consultivo e direto",
        "notes": "Evitar urgência artificial ou promessa de menor preço. Falar em planejamento, cenário e viabilidade."
      }'::jsonb
    ),
    (
      'campaign',
      'Elegibilidade',
      'Inclusão de sócios, dependentes e pró-labore',
      'Esclarece quem pode entrar no contrato e quais vínculos precisam ser revisados antes da cotação.',
      '{
        "audience": "Empresas LTDA, ME e CNPJs familiares que precisam entender quem pode entrar como titular, dependente ou colaborador.",
        "offer": "Análise de elegibilidade para sócios, dependentes, funcionários e pró-labore quando aplicável.",
        "region": "Grande São Paulo",
        "differentiator": "Explica documentação, vínculo e composição mínima antes de avançar para a cotação com a operadora.",
        "tone": "Humano e claro",
        "notes": "Não prometer aceitação automática. Indicar análise conforme regras da operadora e perfil cadastral."
      }'::jsonb
    ),
    (
      'campaign',
      'Primeira contratação',
      'Primeiro plano empresarial para CNPJ em crescimento',
      'Para empresas que nunca contrataram plano e precisam entender por onde começar.',
      '{
        "audience": "Empresas em crescimento que vão contratar plano empresarial pela primeira vez e ainda precisam organizar os critérios da decisão.",
        "offer": "Orientação inicial para definir número de vidas, região de uso e critérios de escolha da operadora antes da proposta.",
        "region": "São Paulo, Barueri, Alphaville",
        "differentiator": "Traduz o processo comercial em próximos passos simples, sem linguagem técnica excessiva.",
        "tone": "Educativo e simples",
        "notes": "Evitar prometer implantação sem análise documental. Focar em orientação e preparo para a cotação."
      }'::jsonb
    )
) as templates(template_type, category, title, description, content)
where not exists (
  select 1
  from public.system_templates existing
  where existing.template_type = templates.template_type
    and existing.title = templates.title
);

notify pgrst, 'reload schema';
