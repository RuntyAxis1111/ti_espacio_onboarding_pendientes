/*
  # Create Ticketing System

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key)
      - `ticket_number` (bigint, auto-generated, unique)
      - `title` (text, required)
      - `area` (text, required)
      - `description` (text, optional)
      - `status` (enum: open, in_progress, resolved, closed)
      - `priority` (enum: low, medium, high, urgent)
      - `created_at` (timestamp, auto)
      - `updated_at` (timestamp, auto)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `tickets` table
    - Add policies for authenticated users to manage tickets

  3. Functions
    - Auto-generate ticket numbers starting from 1000
    - Auto-update timestamps
*/

-- Create enum types
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number bigint UNIQUE NOT NULL,
  title text NOT NULL,
  area text NOT NULL,
  description text,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create sequence for ticket numbers starting at 1000
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

-- Function to auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number = nextval('ticket_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER trigger_update_ticket_timestamp
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_area ON tickets(area);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);