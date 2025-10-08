-- Create tables for Voice AI Call System

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    azure_speech_key text NOT NULL,
    azure_speech_region text NOT NULL,
    dify_api_key text NOT NULL,
    dify_endpoint text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    name text NOT NULL,
    phone_number text NOT NULL,
    email text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, phone_number)
);

-- Call sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    from_number text NOT NULL,
    to_number text NOT NULL,
    start_time timestamptz DEFAULT now(),
    end_time timestamptz,
    status text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id uuid NOT NULL REFERENCES call_sessions(id),
    content text NOT NULL,
    type text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";