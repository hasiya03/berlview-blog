-- 1. Change the ID column from UUID to TEXT
-- This will automatically convert your existing UUIDs to strings, so existing blogs will remain intact and working perfectly!
ALTER TABLE blogs ALTER COLUMN id TYPE text USING id::text;

-- 2. Enable Row Level Security (RLS) on the table
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- 3. Policy for the Public (Anonymous users)
-- They can only READ blogs where is_active is true.
CREATE POLICY "Public can view active blogs"
ON blogs FOR SELECT
TO anon
USING (is_active = true);

-- 4. Policy for Admins (Authenticated users)
-- They have full access to SELECT, INSERT, UPDATE, and DELETE any blog.
CREATE POLICY "Admins can do everything"
ON blogs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
