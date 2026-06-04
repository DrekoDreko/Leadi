-- Add completed column to dashboard_reminders table
ALTER TABLE public.dashboard_reminders ADD COLUMN if not exists completed boolean NOT NULL DEFAULT false;
