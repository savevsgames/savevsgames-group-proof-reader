
-- Create a bucket for document storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'Documents for RAG processing', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for documents
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'documents');

-- Create a table to store document metadata
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  status TEXT DEFAULT 'processing',
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up row level security
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_embeddings
CREATE POLICY "Users can view their own documents"
ON public.document_embeddings
FOR SELECT
USING (book_id IN (
  SELECT id FROM public.books WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own documents"
ON public.document_embeddings
FOR INSERT
WITH CHECK (book_id IN (
  SELECT id FROM public.books WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own documents"
ON public.document_embeddings
FOR UPDATE
USING (book_id IN (
  SELECT id FROM public.books WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own documents"
ON public.document_embeddings
FOR DELETE
USING (book_id IN (
  SELECT id FROM public.books WHERE user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_document_embeddings_updated_at
BEFORE UPDATE ON public.document_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
