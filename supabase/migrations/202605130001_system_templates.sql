-- System templates for campaigns and WhatsApp messages.
-- These are global templates available for all users to copy or use as starting points.

create table if not exists public.system_templates (
  id uuid primary key default gen_random_uuid(),
  template_type text not null check (template_type in ('campaign', 'whatsapp')),
  category text not null, -- e.g. 'MEI', 'PME', 'Reducao de Custo', 'Funil'
  title text not null,
  description text not null default '',
  content jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for quick lookup
create index if not exists system_templates_type_category_idx on public.system_templates (template_type, category);

-- RLS: Read-only for everyone (authenticated)
alter table public.system_templates enable row level security;

drop policy if exists "Everyone can read active system templates" on public.system_templates;
create policy "Everyone can read active system templates"
on public.system_templates
for select
using (is_active = true);

-- Insert examples
insert into public.system_templates (template_type, category, title, description, content)
values
  -- Campaigns
  (
    'campaign',
    'MEI',
    'Plano de Saude para MEI - Vantagens Exclusivas',
    'Focado em microempreendedores que buscam reduzir custos e ter acesso a rede privada.',
    '{
      "audience": "Microempreendedores Individuais (MEI) e profissionais liberais",
      "offer": "Consultoria gratuita para reduzir custos no plano de saude MEI",
      "region": "Brasil",
      "differentiator": "Atendimento personalizado e comparativo entre as melhores operadoras para MEI",
      "tone": "consultivo, direto e seguro",
      "notes": "Destacar que o MEI tem desconto de ate 35% em relacao ao plano individual."
    }'::jsonb
  ),
  (
    'campaign',
    'PME',
    'Saude para Pequenas e Medias Empresas',
    'Focado em empresas de 2 a 99 vidas que querem valorizar a equipe.',
    '{
      "audience": "Donos e gestores de pequenas e medias empresas (PMEs)",
      "offer": "Analise de beneficios para equipe com foco em retencao de talentos",
      "region": "Regiao Metropolitana",
      "differentiator": "Rede credenciada qualificada e gestao simplificada para o RH",
      "tone": "profissional, objetivo e premium",
      "notes": "Enfase na valorizacao do colaborador e deducao fiscal para a empresa."
    }'::jsonb
  ),
  (
    'campaign',
    'Reducao de Custo',
    'Economize no Plano Empresarial Atual',
    'Focado em empresas que ja possuem plano mas estao sofrendo com reajustes.',
    '{
      "audience": "Empresas que ja possuem plano de saude mas buscam economia",
      "offer": "Estudo de viabilidade para reduzir custos sem perder qualidade na rede",
      "region": "Brasil",
      "differentiator": "Comparativo real de precos e analise tecnica de reajustes",
      "tone": "educativo, pratico e confiavel",
      "notes": "Focar na economia de custos fixos sem sacrificar o atendimento aos socios e equipe."
    }'::jsonb
  ),
  -- WhatsApp Messages
  (
    'whatsapp',
    'Funil - Novo Lead',
    'Primeira Abordagem (Boas-vindas)',
    'Mensagem para o primeiro contato logo apos a captacao do lead.',
    '{
      "openingMessage": "Ola [Nome do Lead], aqui e o [Seu Nome] da [Empresa]. Recebi seu interesse em um plano de saude empresarial e gostaria de te dar as boas-vindas!",
      "followUpMessage": "Para eu te enviar uma simulacao bem assertiva, voce teria 2 minutinhos para me confirmar quantas pessoas seriam incluídas no plano?",
      "objectionReply": "Entendo perfeitamente. Muita gente acha que o processo e burocratico, mas minha ideia aqui e justamente simplificar isso para voce. Podemos seguir com apenas 3 perguntas rapidas?"
    }'::jsonb
  ),
  (
    'whatsapp',
    'Funil - Qualificacao',
    'Entendendo Necessidades',
    'Mensagem para identificar rede credenciada e orcamento.',
    '{
      "openingMessage": "Obrigado pelas informacoes, [Nome do Lead]. Agora, para eu selecionar as melhores operadoras: existe algum hospital ou regiao que seja prioridade para voce?",
      "followUpMessage": "Pergunto isso porque as vezes conseguimos um custo muito melhor focando na rede regional, sem perder a qualidade que voce busca.",
      "objectionReply": "Com certeza, custo e fundamental. Vou buscar opcoes que equilibrem uma boa rede com o melhor custo-beneficio para o seu CNPJ."
    }'::jsonb
  ),
  (
    'whatsapp',
    'Funil - Proposta',
    'Apresentacao do Estudo',
    'Mensagem para enviar o comparativo ou proposta oficial.',
    '{
      "openingMessage": "[Nome do Lead], acabei de finalizar o estudo comparativo para sua empresa. Consegui 3 opcoes que se encaixam no que conversamos.",
      "followUpMessage": "Estou te enviando o PDF anexo. O destaque e a opcao [X], que oferece a rede que voce queria com uma economia de [Y]% em relacao ao mercado.",
      "objectionReply": "Entendo a duvida entre as operadoras. A principal diferenca e que a [Opcao A] tem reembolso maior, enquanto a [Opcao B] foca em rede propria. Qual delas faz mais sentido para o seu momento?"
    }'::jsonb
  ),
  (
    'whatsapp',
    'Funil - Negociacao',
    'Fechamento e Proximos Passos',
    'Mensagem para contornar duvidas finais e pedir a documentacao.',
    '{
      "openingMessage": "Ola [Nome do Lead], conseguimos avancar com a proposta que te enviei? Os valores sao validos ate o dia [Data].",
      "followUpMessage": "Se precisar de qualquer ajuste na grade de vidas ou cobertura, me avisa que altero agora mesmo para voce.",
      "objectionReply": "Sobre o prazo de implantacao, se enviarmos o contrato ate amanha, conseguimos garantir o inicio para o dia 01 do proximo mes. Vamos garantir essa data?"
    }'::jsonb
  );
