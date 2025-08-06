/*
  # Fix pending tasks tables schema

  1. Schema Updates
    - Add missing `completed` boolean column to all pending tasks tables
    - Set default value to false
    - Update existing records to have completed = false

  2. Tables Updated
    - `pendientes_johan`
    - `pendientes_dani` 
    - `pendientes_paco`

  3. Security
    - No RLS changes needed (tables already configured)
*/

-- Add completed column to pendientes_johan if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pendientes_johan' AND column_name = 'completed'
  ) THEN
    ALTER TABLE pendientes_johan ADD COLUMN completed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add completed column to pendientes_dani if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pendientes_dani' AND column_name = 'completed'
  ) THEN
    ALTER TABLE pendientes_dani ADD COLUMN completed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add completed column to pendientes_paco if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pendientes_paco' AND column_name = 'completed'
  ) THEN
    ALTER TABLE pendientes_paco ADD COLUMN completed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Update any existing records to have completed = false
UPDATE pendientes_johan SET completed = false WHERE completed IS NULL;
UPDATE pendientes_dani SET completed = false WHERE completed IS NULL;
UPDATE pendientes_paco SET completed = false WHERE completed IS NULL;