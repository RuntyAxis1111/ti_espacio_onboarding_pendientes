/*
  # Disable RLS for tickets table (temporarily)

  1. Security
    - Disable RLS on tickets table temporarily
    - Remove all policies to avoid conflicts
    - Allow anonymous access while auth is disabled

  Note: This is temporary while Google auth is disabled
*/

-- Disable RLS on tickets table
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can read tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON tickets;