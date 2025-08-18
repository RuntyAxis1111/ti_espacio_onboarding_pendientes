/*
  # Update ticketing system with new areas and requester field

  1. Changes
    - Add `requester_name` field to store who requested help
    - Update areas to match Hybe's departments

  2. New Areas
    - Finanzas
    - Legal
    - Podcast
    - Docemil
    - Zarpazo
    - Hybe General
    - Recursos Humanos
    - Artistas
*/

-- Add requester_name field to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requester_name text;

-- Add comment to the new column
COMMENT ON COLUMN tickets.requester_name IS 'Name of the person who requested help';