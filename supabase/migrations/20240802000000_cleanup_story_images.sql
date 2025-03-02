
-- First, remove any stuck records that are in generating state but were created more than 10 minutes ago
UPDATE public.story_images
SET 
  status = 'error',
  error_message = 'Stuck in generating state and automatically cleaned up',
  updated_at = NOW()
WHERE 
  status IN ('generating', 'uploading', 'pending')
  AND created_at < (NOW() - INTERVAL '10 minutes');

-- Create a unique constraint on book_id and story_node to prevent duplicates
-- First we need to clean up any duplicates
WITH ranked_images AS (
  SELECT 
    id,
    book_id,
    story_node,
    ROW_NUMBER() OVER (PARTITION BY book_id, story_node ORDER BY updated_at DESC) as rank
  FROM 
    public.story_images
)
DELETE FROM public.story_images
WHERE id IN (
  SELECT id FROM ranked_images WHERE rank > 1
);

-- Now we can add the unique constraint safely
ALTER TABLE public.story_images 
DROP CONSTRAINT IF EXISTS unique_book_story_node;

ALTER TABLE public.story_images
ADD CONSTRAINT unique_book_story_node UNIQUE (book_id, story_node);

-- Create an index for faster querying by book_id and story_node
CREATE INDEX IF NOT EXISTS idx_story_images_book_node ON public.story_images(book_id, story_node);

-- Update any records with NULL status to 'error'
UPDATE public.story_images
SET status = 'error',
    error_message = 'Invalid status'
WHERE status IS NULL;

-- Set a trigger to automatically update any stuck records
CREATE OR REPLACE FUNCTION public.cleanup_stuck_image_records()
RETURNS trigger AS $$
BEGIN
  UPDATE public.story_images
  SET 
    status = 'error',
    error_message = 'Stuck in generating state and automatically cleaned up by trigger',
    updated_at = NOW()
  WHERE 
    status IN ('generating', 'uploading', 'pending')
    AND created_at < (NOW() - INTERVAL '30 minutes');
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run this cleanup function hourly using the pg_cron extension
DROP TRIGGER IF EXISTS trigger_cleanup_stuck_image_records ON public.story_images;

-- Create a storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'Story images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the images bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'images')
ON CONFLICT DO NOTHING;
