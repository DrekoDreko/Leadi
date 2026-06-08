-- Recreate credit_wallets with team/user wallet support
-- Drop old tables (schema changed significantly from the billing migration)
DROP TABLE IF EXISTS credit_transactions;
DROP TABLE IF EXISTS credit_wallets;

CREATE TABLE credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  team_id UUID REFERENCES teams(id),
  profile_id UUID REFERENCES profiles(id),
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('organization', 'team', 'user')),
  available_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_wallet UNIQUE (organization_id, team_id, profile_id, wallet_type)
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  wallet_id UUID NOT NULL REFERENCES credit_wallets(id),
  team_id UUID REFERENCES teams(id),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  target_user_id UUID REFERENCES profiles(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'allocation', 'usage', 'refund', 'revocation'
  )),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for credit_wallets

-- Owners can view all wallets in their organization
CREATE POLICY "credit_wallets_owner_select" ON credit_wallets
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Admins (supervisors) can view wallets for their team and organization
CREATE POLICY "credit_wallets_admin_select" ON credit_wallets
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND (
      wallet_type = 'organization'
      OR team_id IN (
        SELECT team_id FROM team_members
        WHERE profile_id = auth.uid()
      )
    )
  );

-- Sellers (consultants) can view only their own user wallet
CREATE POLICY "credit_wallets_seller_select" ON credit_wallets
  FOR SELECT
  USING (
    profile_id = auth.uid()
  );

-- Policies for credit_transactions

-- Owners can view all transactions in their organization
CREATE POLICY "credit_transactions_owner_select" ON credit_transactions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Admins (supervisors) can view transactions for their team
CREATE POLICY "credit_transactions_admin_select" ON credit_transactions
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE profile_id = auth.uid()
    )
  );

-- Sellers (consultants) can view transactions where they are the actor or target
CREATE POLICY "credit_transactions_seller_select" ON credit_transactions
  FOR SELECT
  USING (
    actor_id = auth.uid() OR target_user_id = auth.uid()
  );

-- Add indexes for better performance
CREATE INDEX idx_credit_wallets_org_team ON credit_wallets(organization_id, team_id);
CREATE INDEX idx_credit_wallets_profile ON credit_wallets(profile_id);
CREATE INDEX idx_credit_transactions_wallet ON credit_transactions(wallet_id);
CREATE INDEX idx_credit_transactions_team ON credit_transactions(team_id);
CREATE INDEX idx_credit_transactions_actor ON credit_transactions(actor_id);
