-- Adiciona "image_set" aos valores aceitos pela constraint de source do ledger.
-- O codigo (src/lib/ai/credits.ts) registra source = 'image_set' ao gerar um
-- conjunto de imagens (generate_ad_image_set), mas esse valor nao estava na
-- lista permitida, causando violacao de ai_credit_ledger_source_allowed.

alter table public.ai_credit_ledger
  drop constraint if exists ai_credit_ledger_source_allowed;

alter table public.ai_credit_ledger
  add constraint ai_credit_ledger_source_allowed
  check (
    source in (
      'legacy',
      'subscription',
      'package',
      'ai_message',
      'ad_text',
      'campaign',
      'campaign_questions',
      'creative_brief',
      'compliance_review',
      'image_standard',
      'image_premium',
      'image_set',
      'refund',
      'adjustment',
      'expiration'
    )
  );
