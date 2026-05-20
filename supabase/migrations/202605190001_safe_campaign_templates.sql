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
      'Plano empresarial',
      'Migração para plano empresarial',
      'Para pessoas com CNPJ que desejam avaliar alternativas de plano de saúde empresarial.',
      '{
        "audience": "Pessoas com CNPJ, MEI, ME ou LTDA que desejam avaliar alternativas de plano de saúde empresarial.",
        "offer": "Análise consultiva para comparar possibilidades de contratação empresarial conforme perfil da empresa.",
        "region": "São Paulo, SP",
        "differentiator": "Atendimento consultivo, explicação clara das opções e apoio no entendimento das regras de contratação.",
        "tone": "Consultivo e direto",
        "notes": "Evitar promessa de economia garantida. Usar linguagem educativa e profissional."
      }'::jsonb
    ),
    (
      'campaign',
      'MEI',
      'Plano de saúde para MEI',
      'Orientação clara para microempreendedores que querem entender opções com CNPJ.',
      '{
        "audience": "Microempreendedores individuais que buscam entender opções de plano de saúde com CNPJ.",
        "offer": "Orientação sobre possibilidades de contratação para MEI, respeitando critérios das operadoras.",
        "region": "São Paulo, ABC Paulista",
        "differentiator": "Explicação simples sobre documentação, carências, elegibilidade e alternativas disponíveis.",
        "tone": "Humano e claro",
        "notes": "Não afirmar aprovação garantida. Não prometer valores específicos."
      }'::jsonb
    ),
    (
      'campaign',
      'Pequenas empresas',
      'Plano empresarial para pequenas empresas',
      'Cotação orientada para sócios, equipe ou familiares elegíveis.',
      '{
        "audience": "Donos de pequenas empresas que querem organizar benefício de saúde para sócios, equipe ou familiares elegíveis.",
        "offer": "Cotação orientada de planos empresariais conforme quantidade de vidas e perfil da empresa.",
        "region": "Campinas, Jundiaí, Sorocaba",
        "differentiator": "Comparação entre operadoras, rede credenciada e formatos de contratação.",
        "tone": "Consultivo e direto",
        "notes": "Evitar linguagem de urgência exagerada. Focar em clareza e orientação."
      }'::jsonb
    ),
    (
      'campaign',
      'Comparativo',
      'Comparativo entre operadoras',
      'Apoio organizado para comparar rede, abrangência e possibilidades.',
      '{
        "audience": "Empresas que desejam comparar opções entre operadoras como Bradesco, SulAmérica, Amil e outras disponíveis.",
        "offer": "Apoio para comparar rede, abrangência, perfil de uso e possibilidades de contratação.",
        "region": "São Paulo, Guarulhos, Osasco",
        "differentiator": "Comparativo organizado para ajudar o cliente a tomar decisão com mais segurança.",
        "tone": "Profissional e objetivo",
        "notes": "Não depreciar operadoras. Não prometer melhor preço absoluto."
      }'::jsonb
    ),
    (
      'campaign',
      'Elegibilidade',
      'Inclusão de sócios e equipe',
      'Análise de elegibilidade para titulares, colaboradores e dependentes.',
      '{
        "audience": "Empresas LTDA, ME e pequenos negócios que precisam entender quem pode entrar como titular ou dependente.",
        "offer": "Análise das possibilidades de inclusão de sócios, colaboradores e dependentes conforme regras da operadora.",
        "region": "Grande São Paulo",
        "differentiator": "Orientação sobre documentação, elegibilidade e composição de vidas.",
        "tone": "Humano e claro",
        "notes": "Não prometer aceitação automática. Focar em análise de viabilidade."
      }'::jsonb
    ),
    (
      'campaign',
      'Revisão',
      'Revisão de contrato atual',
      'Diagnóstico consultivo para revisar rede, condições e alternativas.',
      '{
        "audience": "Empresas que já possuem plano de saúde e querem revisar opções, rede e condições disponíveis.",
        "offer": "Revisão consultiva do cenário atual e apresentação de alternativas quando fizer sentido.",
        "region": "São Paulo, Santos, Interior de SP",
        "differentiator": "Diagnóstico organizado antes de sugerir qualquer mudança.",
        "tone": "Consultivo e direto",
        "notes": "Evitar “você está pagando caro”. Usar “avaliar alternativas” ou “revisar possibilidades”."
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
