-- This script updates all existing UUIDs in the blogs table to the new descriptive slug format.
-- It generates the slug from the title and appends the first 8 characters of the old UUID to maintain uniqueness.

UPDATE blogs
SET id = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '-' || substr(id, 1, 8)
-- Only update rows where the ID is still a traditional UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
