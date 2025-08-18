/*
  # Disable RLS for tickets table temporarily
  
  This migration temporarily disables Row Level Security for the tickets table
  to allow anonymous users to create and manage tickets while authentication
  is disabled.
  
  IMPORTANT: Re-enable RLS when authentication is restored!
*/

-- Disable RLS on tickets table temporarily
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON tickets;
DROP POLICY IF EXISTS "Temp: Anon can create tickets" ON tickets;
DROP POLICY IF EXISTS "Temp: Anon can view tickets" ON tickets;
DROP POLICY IF EXISTS "Temp: Anon can update tickets" ON tickets;