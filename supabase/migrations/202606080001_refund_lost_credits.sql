-- Refund AI credits lost due to bug where requirePlatformOpenAIKey()
-- was called after consumeAiCredits() but outside the try/catch refund block.
-- When the OpenAI key was missing, credits were consumed without refund.

do $$
declare
  v_org record;
  v_result record;
begin
  for v_org in
    select e.org_id, sum(e.credits_charged) as lost
    from public.ai_usage_events e
    where e.status = 'failed'
      and e.error_message ilike '%api key%'
      and not exists (
        select 1
        from public.ai_usage_events r
        where r.status = 'refunded'
          and r.org_id = e.org_id
          and r.feature = e.feature
          and r.metadata->>'operationId' = e.metadata->>'operationId'
      )
    group by e.org_id
  loop
    if v_org.lost > 0 then
      select *
      into v_result
      from public.add_ai_credits(
        target_org_id := v_org.org_id,
        amount := v_org.lost::integer,
        p_type := 'refund',
        p_user_id := null,
        p_reason := 'Estorno automático: créditos consumidos por erro de chave OpenAI',
        p_reference_type := 'admin_bugfix_refund',
        p_reference_id := null,
        p_metadata := jsonb_build_object(
          'reason', 'bugfix_openai_key_refund',
          'credits_refunded', v_org.lost
        )
      );
    end if;
  end loop;
end;
$$;
