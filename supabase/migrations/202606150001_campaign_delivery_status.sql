-- Reconciliacao do status real de veiculacao da campanha lido da Meta.
-- Ate aqui publication_status era escrito apenas pelas acoes do app (publicar/
-- ativar/pausar) e nunca conferido contra a Meta, o que gerava mensagens fixas
-- como "entrou em revisao" mesmo para anuncios ja aprovados. Estas colunas
-- guardam o ultimo effective_status lido da Graph API e o momento da leitura.
alter table public.campaigns
  add column if not exists meta_effective_status text,
  add column if not exists delivery_status_synced_at timestamptz;

comment on column public.campaigns.meta_effective_status is
  'Ultimo effective_status lido da Meta para o anuncio/conjunto/campanha (fonte da verdade de veiculacao).';
comment on column public.campaigns.delivery_status_synced_at is
  'Momento da ultima reconciliacao do status de veiculacao com a Meta.';
