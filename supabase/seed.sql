-- =============================================================================
-- Seed: Corretora CodeYellow — 7 usuarios, plano Equipe, 2 equipes
-- =============================================================================
-- Strategy: insert all 7 auth users (trigger creates separate orgs for each),
-- then consolidate everyone into the owner's org and clean up extras.

do $$
declare
  -- Auth user IDs
  owner_auth_id    uuid := 'a0000000-0000-0000-0000-000000000001';
  super1_auth_id   uuid := 'a0000000-0000-0000-0000-000000000002';
  super2_auth_id   uuid := 'a0000000-0000-0000-0000-000000000003';
  consult1_auth_id uuid := 'a0000000-0000-0000-0000-000000000004';
  consult2_auth_id uuid := 'a0000000-0000-0000-0000-000000000005';
  consult3_auth_id uuid := 'a0000000-0000-0000-0000-000000000006';
  consult4_auth_id uuid := 'a0000000-0000-0000-0000-000000000007';

  -- Will be populated
  owner_profile_id    uuid;
  super1_profile_id   uuid;
  super2_profile_id   uuid;
  consult1_profile_id uuid;
  consult2_profile_id uuid;
  consult3_profile_id uuid;
  consult4_profile_id uuid;

  org_id     uuid;
  team_a_id  uuid := 'b0000000-0000-0000-0000-000000000001';
  team_b_id  uuid := 'b0000000-0000-0000-0000-000000000002';
  equipe_plan_id uuid;
  pw_hash text;

  -- Extra org IDs to clean up
  extra_org_ids uuid[];
begin
  pw_hash := crypt('consult123', gen_salt('bf'));

  -- -------------------------------------------------------
  -- 1. Insert all 7 auth users + identities
  --    The on_auth_user_created trigger creates org + profile + workspace_member for each
  -- -------------------------------------------------------
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values
    (owner_auth_id,    '00000000-0000-0000-0000-000000000000', 'owner@codeellow.com',    pw_hash, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Gestor CodeYellow"}',  now(), now(), '', '', '', '', '', '', '', ''),
    (super1_auth_id,   '00000000-0000-0000-0000-000000000000', 'super1@codeellow.com',   pw_hash, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Supervisor Alpha"}',   now(), now(), '', '', '', '', '', '', '', ''),
    (super2_auth_id,   '00000000-0000-0000-0000-000000000000', 'super2@codeellow.com',   pw_hash, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Supervisor Beta"}',    now(), now(), '', '', '', '', '', '', '', ''),
    (consult1_auth_id, '00000000-0000-0000-0000-000000000000', 'consult1@codeellow.com', pw_hash, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Consultor 1"}',        now(), now(), '', '', '', '', '', '', '', ''),
    (consult2_auth_id, '00000000-0000-0000-0000-000000000000', 'consult2@codeellow.com', pw_hash, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Consultor 2"}',        now(), now(), '', '', '', '', '', '', '', ''),
    (consult3_auth_id, '00000000-0000-0000-0000-000000000000', 'consult3@codeellow.com', pw_hash, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Consultor 3"}',        now(), now(), '', '', '', '', '', '', '', ''),
    (consult4_auth_id, '00000000-0000-0000-0000-000000000000', 'consult4@codeellow.com', pw_hash, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Consultor 4"}',        now(), now(), '', '', '', '', '', '', '', '');

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values
    (owner_auth_id,    owner_auth_id,    jsonb_build_object('sub', owner_auth_id::text,    'email', 'owner@codeellow.com'),    'email', owner_auth_id::text,    now(), now(), now()),
    (super1_auth_id,   super1_auth_id,   jsonb_build_object('sub', super1_auth_id::text,   'email', 'super1@codeellow.com'),   'email', super1_auth_id::text,   now(), now(), now()),
    (super2_auth_id,   super2_auth_id,   jsonb_build_object('sub', super2_auth_id::text,   'email', 'super2@codeellow.com'),   'email', super2_auth_id::text,   now(), now(), now()),
    (consult1_auth_id, consult1_auth_id, jsonb_build_object('sub', consult1_auth_id::text, 'email', 'consult1@codeellow.com'), 'email', consult1_auth_id::text, now(), now(), now()),
    (consult2_auth_id, consult2_auth_id, jsonb_build_object('sub', consult2_auth_id::text, 'email', 'consult2@codeellow.com'), 'email', consult2_auth_id::text, now(), now(), now()),
    (consult3_auth_id, consult3_auth_id, jsonb_build_object('sub', consult3_auth_id::text, 'email', 'consult3@codeellow.com'), 'email', consult3_auth_id::text, now(), now(), now()),
    (consult4_auth_id, consult4_auth_id, jsonb_build_object('sub', consult4_auth_id::text, 'email', 'consult4@codeellow.com'), 'email', consult4_auth_id::text, now(), now(), now());

  -- -------------------------------------------------------
  -- 2. Get the owner's profile and org (auto-created by trigger)
  -- -------------------------------------------------------
  select id, organization_id
    into owner_profile_id, org_id
    from public.profiles
   where auth_user_id = owner_auth_id;

  select id into super1_profile_id   from public.profiles where auth_user_id = super1_auth_id;
  select id into super2_profile_id   from public.profiles where auth_user_id = super2_auth_id;
  select id into consult1_profile_id from public.profiles where auth_user_id = consult1_auth_id;
  select id into consult2_profile_id from public.profiles where auth_user_id = consult2_auth_id;
  select id into consult3_profile_id from public.profiles where auth_user_id = consult3_auth_id;
  select id into consult4_profile_id from public.profiles where auth_user_id = consult4_auth_id;

  -- Collect extra org IDs (the ones auto-created for non-owner users)
  select array_agg(organization_id)
    into extra_org_ids
    from public.profiles
   where auth_user_id in (super1_auth_id, super2_auth_id, consult1_auth_id, consult2_auth_id, consult3_auth_id, consult4_auth_id);

  -- -------------------------------------------------------
  -- 3. Move all members to the owner's org
  -- -------------------------------------------------------
  -- Update profiles
  update public.profiles
     set organization_id = org_id,
         role = 'admin',
         profile_setup_completed = true
   where auth_user_id in (super1_auth_id, super2_auth_id);

  update public.profiles
     set organization_id = org_id,
         role = 'seller',
         profile_setup_completed = true
   where auth_user_id in (consult1_auth_id, consult2_auth_id, consult3_auth_id, consult4_auth_id);

  update public.profiles
     set profile_setup_completed = true
   where id = owner_profile_id;

  -- Update workspace_members to point to the owner's org
  update public.workspace_members
     set workspace_id = org_id,
         role = 'admin'
   where user_id in (super1_profile_id, super2_profile_id);

  update public.workspace_members
     set workspace_id = org_id,
         role = 'seller'
   where user_id in (consult1_profile_id, consult2_profile_id, consult3_profile_id, consult4_profile_id);

  -- -------------------------------------------------------
  -- 4. Update the owner's org to team type
  -- -------------------------------------------------------
  update public.organizations
     set type = 'team',
         name = 'Corretora CodeYellow'
   where id = org_id;

  -- Delete extra orgs (cascade removes any leftover references)
  delete from public.organizations
   where id = any(extra_org_ids)
     and id <> org_id;

  -- -------------------------------------------------------
  -- 5. Create two teams
  -- -------------------------------------------------------
  insert into public.teams (id, organization_id, name, created_by_profile_id, is_active)
  values
    (team_a_id, org_id, 'Equipe Alpha', owner_profile_id, true),
    (team_b_id, org_id, 'Equipe Beta',  owner_profile_id, true);

  -- -------------------------------------------------------
  -- 6. Assign members to teams
  -- -------------------------------------------------------
  insert into public.team_members (team_id, profile_id, organization_id, role, status, added_by_profile_id)
  values
    (team_a_id, super1_profile_id,   org_id, 'supervisor',  'active', owner_profile_id),
    (team_a_id, consult1_profile_id, org_id, 'consultant',  'active', owner_profile_id),
    (team_a_id, consult2_profile_id, org_id, 'consultant',  'active', owner_profile_id),
    (team_b_id, super2_profile_id,   org_id, 'supervisor',  'active', owner_profile_id),
    (team_b_id, consult3_profile_id, org_id, 'consultant',  'active', owner_profile_id),
    (team_b_id, consult4_profile_id, org_id, 'consultant',  'active', owner_profile_id);

  -- -------------------------------------------------------
  -- 7. Create active subscription with Equipe plan
  -- -------------------------------------------------------
  select id into equipe_plan_id from public.plans where code = 'equipe' limit 1;

  if equipe_plan_id is not null then
    insert into public.subscriptions (
      organization_id, plan_id, status, gateway,
      current_period_start, current_period_end, metadata
    ) values (
      org_id, equipe_plan_id, 'active', 'manual',
      now(), now() + interval '30 days',
      jsonb_build_object('seed', true, 'reason', 'Local development seed')
    );
  end if;

  -- -------------------------------------------------------
  -- 8. Create credit wallets
  -- -------------------------------------------------------
  insert into public.credit_wallets (organization_id, wallet_type, available_credits)
  values (org_id, 'organization', 150);

  insert into public.credit_wallets (organization_id, team_id, wallet_type, available_credits)
  values
    (org_id, team_a_id, 'team', 0),
    (org_id, team_b_id, 'team', 0);

  insert into public.credit_wallets (organization_id, profile_id, wallet_type, available_credits)
  values
    (org_id, consult1_profile_id, 'user', 0),
    (org_id, consult2_profile_id, 'user', 0),
    (org_id, consult3_profile_id, 'user', 0),
    (org_id, consult4_profile_id, 'user', 0);

  raise notice 'Seed complete: org=%, owner=%, teams=[%,%]', org_id, owner_profile_id, team_a_id, team_b_id;
end;
$$;
