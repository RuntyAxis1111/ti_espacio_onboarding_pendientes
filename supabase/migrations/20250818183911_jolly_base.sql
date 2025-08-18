/*
  # Disable RLS for computadoras_con_seguro table

  1. Security Changes
    - Disable RLS on computadoras_con_seguro table temporarily
    - Remove any existing policies to avoid conflicts
    - Allow anonymous access while authentication is disabled

  Note: This is temporary while Google auth is disabled.
  When auth is re-enabled, RLS should be enabled with proper policies.
*/

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can read computadoras" ON computadoras_con_seguro;
DROP POLICY IF EXISTS "Users can insert computadoras" ON computadoras_con_seguro;
DROP POLICY IF EXISTS "Users can update computadoras" ON computadoras_con_seguro;

-- Disable RLS temporarily
ALTER TABLE computadoras_con_seguro DISABLE ROW LEVEL SECURITY;