-- Migration: Add approval_status to campaigns
-- Data: 2026-05-30

ALTER TABLE campaigns
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'not_required'
CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected', 'needs_adjustment'));
