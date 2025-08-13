-- Create recipe-images bucket for storing recipe images
-- This should be run in the Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload their own recipe images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all recipe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Users can update their own recipe images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'recipe-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own recipe images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add comment
COMMENT ON TABLE storage.objects IS 'Recipe images stored in recipe-images bucket';
