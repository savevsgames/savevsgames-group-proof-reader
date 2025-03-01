
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'
import { corsHeaders } from '../_shared/cors.ts'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || ''

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
    const { bookId, prompt, nodeId } = await req.json()
    
    if (!bookId || !prompt) {
      throw new Error('Book ID or prompt missing')
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

    // Get LLM settings for the book
    const { data: llmSettings, error: llmError } = await supabase
      .from('book_llm_settings')
      .select('*')
      .eq('book_id', bookId)
      .single()

    // Use default settings if none are found
    const modelVersion = llmSettings?.model_version || 'gpt-4o'
    const temperature = llmSettings?.temperature || 0.7
    const permanentContext = llmSettings?.permanent_context || ''

    // Get context files for the book
    const { data: contextFiles, error: filesError } = await supabase
      .from('book_context_files')
      .select('*')
      .eq('book_id', bookId)

    // Build the request to OpenAI
    let systemPrompt = "You are a creative writing assistant helping with an interactive story. "
    
    if (permanentContext) {
      systemPrompt += "Here is some important context about the story world:\n\n" + permanentContext + "\n\n"
    }

    // If there are context files, mention that they've been considered
    if (contextFiles && contextFiles.length > 0) {
      systemPrompt += `The story includes ${contextFiles.length} reference documents that have been analyzed. `
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelVersion,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          content: data.choices[0].message.content,
          nodeId: nodeId
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
