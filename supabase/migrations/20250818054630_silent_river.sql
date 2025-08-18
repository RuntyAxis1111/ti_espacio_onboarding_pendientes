/*
  # Fix RLS policies for tickets table

  1. Security Changes
    - Enable RLS on tickets table
    - Add policy for authenticated users to read all tickets
    - Add policy for authenticated users to create tickets
    - Add policy for authenticated users to update tickets
    - Add temporary policy for anonymous users (while auth is disabled)

  2. Notes
    - Temporary anon policies should be removed when authentication is re-enabled
    - This allows the ticketing system to work while Google Auth is commented out
*/

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view all tickets
CREATE POLICY "Users can view all tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to create tickets
CREATE POLICY "Users can create tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update tickets
CREATE POLICY "Users can update tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (true);

-- TEMPORARY: Allow anonymous users while auth is disabled
-- Remove these policies when Google Auth is re-enabled
CREATE POLICY "Temp: Anon can view tickets"
  ON tickets
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Temp: Anon can create tickets"
  ON tickets
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Temp: Anon can update tickets"
  ON tickets
  FOR UPDATE
  TO anon
  USING (true);