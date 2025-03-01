
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const storyId = formData.get("storyId") as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!storyId) {
      return new Response(
        JSON.stringify({ error: "Story ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sanitize filename
    const filename = file.name.replace(/[^\x00-\x7F]/g, "");
    const fileExt = filename.split(".").pop() || "";
    const uniqueFilePath = `${storyId}/${crypto.randomUUID()}.${fileExt}`;

    // Upload file to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("documents")
      .upload(uniqueFilePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file to storage", details: storageError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create document record in database
    const { data: dbData, error: dbError } = await supabase
      .from("document_embeddings")
      .insert({
        book_id: storyId,
        filename: filename,
        file_path: uniqueFilePath,
        content_type: file.type,
        size: file.size,
        status: "processing", // Will be processed asynchronously
      })
      .select();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save document metadata", details: dbError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In a production app, we would trigger document processing here
    // For now, we'll just return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Document uploaded successfully",
        documentId: dbData[0]?.id,
        status: "processing",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing document upload:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
