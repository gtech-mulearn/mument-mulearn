-- Add buddies_enabled column to admin_settings table
ALTER TABLE public.admin_settings
ADD COLUMN buddies_enabled boolean NOT NULL DEFAULT true;

-- Update existing record to ensure it has the new column
UPDATE public.admin_settings
SET buddies_enabled = true
WHERE buddies_enabled IS NULL;
