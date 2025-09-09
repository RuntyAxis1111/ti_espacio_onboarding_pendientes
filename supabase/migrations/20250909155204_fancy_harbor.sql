/*
  # Add serial number field to IT Checklist

  1. Changes
    - Add `serial_number` column to `it_checklist` table
    - Column is optional (nullable) to not break existing records
    - Text type to store computer serial numbers

  2. Security
    - No RLS changes needed (already disabled)
*/

ALTER TABLE it_checklist 
ADD COLUMN IF NOT EXISTS serial_number text;

COMMENT ON COLUMN it_checklist.serial_number IS 'Número de serie de la computadora asignada al empleado';