-- FINAL CLEAN SQL Schema for CBSE TOPPERS
-- Copy and paste this into your Supabase SQL Editor if setting up from scratch.

-- 1. Create the Students Table
-- Note: Security is now handled via Supabase Auth.
-- The password is no longer stored in this table.
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  class TEXT NOT NULL,
  stream TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  student_id VARCHAR(10) UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT TRUE
);

-- 2. Security Configuration
-- Disabling RLS for initial development/demonstration
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_students_id_email ON students(student_id, email);
