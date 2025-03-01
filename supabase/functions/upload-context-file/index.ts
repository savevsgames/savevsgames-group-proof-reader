
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'
import { corsHeaders } from '../_shared/cors.ts'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('No authorization token provided')
    }

    // Create a Supabase client with the auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })

    // Get user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Invalid token or user not found')
    }

    // Parse the request body
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bookId = formData.get('bookId') as string
    
    if (!file || !bookId) {
      throw new Error('File or book ID missing')
    }

    // Verify book ownership
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: bookData, error: bookError } = await adminSupabase
      .from('books')
      .select('id, creator_id')
      .eq('id', bookId)
      .single()

    if (bookError || !bookData) {
      throw new Error('Book not found')
    }

    if (bookData.creator_id !== user.id) {
      throw new Error('Unauthorized: User does not own this book')
    }

    // Generate a file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${bookId}/${fileName}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('rag_context_files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from('rag_context_files')
      .getPublicUrl(filePath)

    // Create record in book_context_files table
    const { data: contextFile, error: contextError } = await supabase
      .from('book_context_files')
      .insert({
        book_id: bookId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type
      })
      .select()
      .single()

    if (contextError) {
      throw new Error(`Failed to create context file record: ${contextError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          file: contextFile,
          url: urlData.publicUrl
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
})
