-- Create Supabase Storage Bucket for Avatars
-- Run this in Supabase SQL Editor

-- Step 1: Create the picture bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('picture', 'picture', true);

-- Step 2: Create RLS policy for public access to pictures
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'picture');

-- Step 3: Create policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'picture' 
    AND auth.role() = 'authenticated'
);

-- Step 4: Create policy for users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'picture' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 5: Create policy for users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
    bucket_id = 'picture' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 6: Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'picture';

