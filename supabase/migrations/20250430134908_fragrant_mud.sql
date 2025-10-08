/*
  # Add customer tags functionality

  1. New Tables
    - `tags`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamptz)
    
    - `customer_tags`
      - `customer_id` (uuid, foreign key)
      - `tag_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_tags (
  customer_id uuid NOT NULL REFERENCES users(id),
  tag_id uuid NOT NULL REFERENCES tags(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant's tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = tags.tenant_id
  ));

CREATE POLICY "Users can manage own tenant's tags"
  ON tags
  FOR ALL
  TO authenticated
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = tags.tenant_id
  ));

CREATE POLICY "Users can read own tenant's customer tags"
  ON customer_tags
  FOR SELECT
  TO authenticated
  USING (tag_id IN (
    SELECT id FROM tags WHERE tenant_id IN (
      SELECT id FROM tenants WHERE id = tags.tenant_id
    )
  ));

CREATE POLICY "Users can manage own tenant's customer tags"
  ON customer_tags
  FOR ALL
  TO authenticated
  USING (tag_id IN (
    SELECT id FROM tags WHERE tenant_id IN (
      SELECT id FROM tenants WHERE id = tags.tenant_id
    )
  ));