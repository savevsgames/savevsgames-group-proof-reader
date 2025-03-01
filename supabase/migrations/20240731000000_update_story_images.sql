
-- Add new fields to the story_images table for improved error handling and tracking
ALTER TABLE IF EXISTS public.story_images
ADD COLUMN IF NOT EXISTS request_id UUID,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_story_images_book_id ON public.story_images(book_id);
CREATE INDEX IF NOT EXISTS idx_story_images_request_id ON public.story_images(request_id);

-- Ensure the story_images table has the correct status enum values
-- by updating any rows with NULL status to 'pending'
UPDATE public.story_images
SET status = 'pending'
WHERE status IS NULL;

-- Create a storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'Story images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the images bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'images')
ON CONFLICT DO NOTHING;
