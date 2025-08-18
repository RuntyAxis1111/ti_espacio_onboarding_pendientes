/*
  # Reset tickets table and numbering

  1. Clean up
    - Delete all existing tickets
    - Reset the sequence to start from 1
  
  2. Update trigger function
    - Change starting number to 1 (which will display as #0001)
    - Ensure proper formatting with leading zeros
*/

-- Delete all existing tickets
DELETE FROM tickets;

-- Reset the sequence that generates ticket numbers
-- This will make the next ticket start from 1
SELECT setval('tickets_ticket_number_seq', 1, false);

-- Update the trigger function to start from 1 and format properly
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate the next ticket number starting from 1
  NEW.ticket_number := nextval('tickets_ticket_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;