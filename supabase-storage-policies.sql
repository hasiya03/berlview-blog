-- Note: RLS is already enabled by default on storage.objects in Supabase.
-- Attempting to ALTER the table can cause a permission error.
-- 1. Policies for 'blog-images' bucket
-- Allow anyone to read the images
CREATE POLICY "Public can view blog-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-images' );

-- Allow authenticated Admins to upload images
CREATE POLICY "Admins can upload blog-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-images' );

-- Allow authenticated Admins to update images
CREATE POLICY "Admins can update blog-images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'blog-images' );

-- Allow authenticated Admins to delete images
CREATE POLICY "Admins can delete blog-images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'blog-images' );


-- 2. Policies for 'blog-md' bucket
-- Allow anyone to read the markdown files
CREATE POLICY "Public can view blog-md"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-md' );

-- Allow authenticated Admins to upload markdown files
CREATE POLICY "Admins can upload blog-md"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-md' );

-- Allow authenticated Admins to update markdown files
CREATE POLICY "Admins can update blog-md"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'blog-md' );

-- Allow authenticated Admins to delete markdown files
CREATE POLICY "Admins can delete blog-md"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'blog-md' );
