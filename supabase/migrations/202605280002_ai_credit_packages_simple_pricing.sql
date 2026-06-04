update public.ai_credit_packages
set
  name = '100 créditos',
  credits = 100,
  price_cents = 3000,
  description = 'Recarga enxuta para continuar usando a IA no dia a dia.',
  is_featured = false,
  metadata = jsonb_build_object(
    'approximate_uses',
    jsonb_build_array(
      'Créditos liberados para a organização após a confirmação do pagamento.',
      'Uso flexível em mensagens, textos, campanhas e imagens.'
    )
  )
where slug = 'essencial';

update public.ai_credit_packages
set
  name = '300 créditos',
  credits = 300,
  price_cents = 7000,
  description = 'Mais volume com custo por crédito melhor para uso recorrente.',
  is_featured = false,
  metadata = jsonb_build_object(
    'approximate_uses',
    jsonb_build_array(
      'Boa faixa para times que usam IA com frequência na rotina.',
      'Menor custo por crédito do que a recarga inicial.'
    )
  )
where slug = 'campanhas';

update public.ai_credit_packages
set
  name = '1000 créditos',
  credits = 1000,
  price_cents = 15000,
  description = 'Maior volume com o menor custo por crédito da vitrine.',
  is_featured = true,
  metadata = jsonb_build_object(
    'badge',
    'Melhor valor',
    'approximate_uses',
    jsonb_build_array(
      'Pensado para equipes com uso intenso de IA no workspace.',
      'Melhor custo por crédito entre os pacotes disponíveis.'
    )
  )
where slug = 'criativos';
