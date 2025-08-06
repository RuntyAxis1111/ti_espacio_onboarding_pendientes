/*
  # Add comments column to IT checklist

  1. Changes
    - Add `comments` text column to `it_checklist` table
    - Allow null values for optional comments
    - Add index for better performance

  2. Security
    - No RLS changes needed (table already configured)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'it_checklist' AND column_name = 'comments'
  ) THEN
    ALTER TABLE it_checklist ADD COLUMN comments text;
  END IF;
END $$;

-- Add index for comments column
CREATE INDEX IF NOT EXISTS idx_it_checklist_comments ON it_checklist(comments) WHERE comments IS NOT NULL;