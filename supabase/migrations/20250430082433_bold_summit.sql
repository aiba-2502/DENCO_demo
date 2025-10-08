/*
  # Add FAX functionality tables

  1. New Tables
    - `fax_documents`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `direction` (text) - 'inbound' or 'outbound'
      - `sender_number` (text)
      - `receiver_number` (text)
      - `status` (text)
      - `tiff_path` (text)
      - `pdf_path` (text)
      - `ocr_text` (text)
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz)
      
  2. Security
    - Enable RLS on `fax_documents` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS fax_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_number text NOT NULL,
  receiver_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tiff_path text,
  pdf_path text,
  ocr_text text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE fax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant's fax documents"
  ON fax_documents
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = fax_documents.tenant_id
  ));