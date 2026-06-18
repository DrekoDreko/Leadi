-- Corrige conflito entre o check meta_ad_image_uploads_scope_check
-- (exige exatamente um de creative_request_id / campaign_id preenchido)
-- e as FKs com "on delete set null".
--
-- Ao excluir uma campanha (ou um creative_request), o "set null" zerava o
-- escopo restante, deixando os dois campos nulos e violando o check
-- (num_nonnulls = 0), com o erro:
--   new row for relation "meta_ad_image_uploads" violates check
--   constraint "meta_ad_image_uploads_scope_check"
--
-- Como um upload sem campanha E sem creative_request e um estado invalido por
-- definicao, a FK passa a apagar o upload junto com o pai (on delete cascade).

alter table public.meta_ad_image_uploads
  drop constraint if exists meta_ad_image_uploads_campaign_id_fkey,
  add constraint meta_ad_image_uploads_campaign_id_fkey
    foreign key (campaign_id) references public.campaigns(id) on delete cascade;

alter table public.meta_ad_image_uploads
  drop constraint if exists meta_ad_image_uploads_creative_request_id_fkey,
  add constraint meta_ad_image_uploads_creative_request_id_fkey
    foreign key (creative_request_id) references public.creative_requests(id) on delete cascade;

notify pgrst, 'reload schema';
