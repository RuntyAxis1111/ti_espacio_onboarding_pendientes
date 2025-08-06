/*
  # Add ChatGPT column to IT Checklist

  1. Changes
    - Add `chatgpt` boolean column to `it_checklist` table
    - Default value: false
    - Allow null values for existing records

  2. Notes
    - This adds ChatGPT access tracking to the onboarding checklist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'it_checklist' AND column_name = 'chatgpt'
  ) THEN
    ALTER TABLE it_checklist ADD COLUMN chatgpt boolean DEFAULT false;
  END IF;
END $$;