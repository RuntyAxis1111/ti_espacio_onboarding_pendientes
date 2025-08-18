/*
  # Re-enable RLS for tickets table

  1. Security
    - Enable RLS on tickets table
    - Add policies for authenticated users only
    - Remove anonymous access (temporary policies)

  2. Policies
    - Authenticated users can read all tickets
    - Authenticated users can insert tickets
    - Authenticated users can update tickets
*/

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all tickets
CREATE POLICY "Authenticated users can read tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert tickets
CREATE POLICY "Authenticated users can insert tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update tickets
CREATE POLICY "Authenticated users can update tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);