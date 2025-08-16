-- Create recipe-images bucket for storing recipe images
-- This should be run in the Supabase SQL Editor

-- Create the bucket (this is sufficient for public access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket (only if they don't exist)
DO $$
BEGIN
    -- Policy for INSERT (upload)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can upload recipe images'
    ) THEN
        CREATE POLICY "Users can upload recipe images" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'recipe-images' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
    END IF;

    -- Policy for SELECT (view)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can view recipe images'
    ) THEN
        CREATE POLICY "Users can view recipe images" ON storage.objects
          FOR SELECT USING (bucket_id = 'recipe-images');
    END IF;

    -- Policy for UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can update recipe images'
    ) THEN
        CREATE POLICY "Users can update recipe images" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'recipe-images' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
    END IF;

    -- Policy for DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can delete recipe images'
    ) THEN
        CREATE POLICY "Users can delete recipe images" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'recipe-images' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
    END IF;
END $$;

-- Note: RLS policies are automatically handled by Supabase for public buckets
-- Users can upload, view, and manage their own files through the Supabase client
