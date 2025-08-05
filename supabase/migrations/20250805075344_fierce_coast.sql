/*
  # Create pending tasks tables

  1. New Tables
    - `pendientes_johan`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `start_date` (date, optional)
      - `due_date` (date, optional)
      - `importance` (enum: baja, media, alta, critica)
      - `completed` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pendientes_dani` (same structure)
    - `pendientes_paco` (same structure)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create importance enum
CREATE TYPE IF NOT EXISTS importance_level AS ENUM ('baja', 'media', 'alta', 'critica');

-- Create pendientes_johan table
CREATE TABLE IF NOT EXISTS pendientes_johan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date,
  due_date date,
  importance importance_level DEFAULT 'media',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pendientes_dani table
CREATE TABLE IF NOT EXISTS pendientes_dani (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date,
  due_date date,
  importance importance_level DEFAULT 'media',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pendientes_paco table
CREATE TABLE IF NOT EXISTS pendientes_paco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date,
  due_date date,
  importance importance_level DEFAULT 'media',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pendientes_johan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendientes_dani ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendientes_paco ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on pendientes_johan"
  ON pendientes_johan
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on pendientes_dani"
  ON pendientes_dani
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on pendientes_paco"
  ON pendientes_paco
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pendientes_johan_updated_at
    BEFORE UPDATE ON pendientes_johan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pendientes_dani_updated_at
    BEFORE UPDATE ON pendientes_dani
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pendientes_paco_updated_at
    BEFORE UPDATE ON pendientes_paco
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();