
-- Add model_settings column to book_llm_settings table
ALTER TABLE IF EXISTS public.book_llm_settings
ADD COLUMN IF NOT EXISTS model_settings JSONB;

-- Update trigger to include the new column
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.book_llm_settings.model_settings IS 'JSON object containing model settings like model name and temperature';
