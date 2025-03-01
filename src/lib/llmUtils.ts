
import { supabase } from "@/lib/supabase";
import { fetchComments } from "@/lib/storyUtils";
import { CommentType, commentTypeLabels } from "@/lib/commentTypes";

// Interface for comment context with proper typing
interface CommentContextItem {
  type: CommentType;
  text: string;
  username: string;
}

interface ModelSettings {
  model: string;
  temperature: number;
}

// Load system prompt from Supabase
export const loadSystemPrompt = async (storyId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("book_llm_settings")
      .select("system_prompt")
      .eq("book_id", storyId)
      .single();

    if (error) {
      console.error("Error loading system prompt:", error);
      return getDefaultSystemPrompt();
    }

    if (data && data.system_prompt) {
      return data.system_prompt;
    } else {
      return getDefaultSystemPrompt();
    }
  } catch (err) {
    console.error("Error in loadSystemPrompt:", err);
    return getDefaultSystemPrompt();
  }
};

// Load model settings from Supabase
export const loadModelSettings = async (storyId: string): Promise<ModelSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("book_llm_settings")
      .select("model_settings")
      .eq("book_id", storyId)
      .single();

    if (error) {
      console.error("Error loading model settings:", error);
      return null;
    }

    if (data && data.model_settings) {
      return data.model_settings;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error in loadModelSettings:", err);
    return null;
  }
};

// Save system prompt to Supabase
export const saveSystemPrompt = async (storyId: string, systemPrompt: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("book_llm_settings")
      .upsert({
        book_id: storyId,
        system_prompt: systemPrompt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Error saving system prompt:", err);
    return false;
  }
};

// Save model settings to Supabase
export const saveModelSettings = async (
  storyId: string, 
  modelSettings: ModelSettings
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("book_llm_settings")
      .upsert({
        book_id: storyId,
        model_settings: modelSettings,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Error saving model settings:", err);
    return false;
  }
};

// Load comments for the current page
export const loadComments = async (storyId: string, currentPage: number) => {
  try {
    if (!storyId || !currentPage) return [];
    
    const commentsData = await fetchComments(storyId, currentPage);
    return commentsData;
  } catch (err) {
    console.error("Error loading comments:", err);
    return [];
  }
};

// Get default system prompt
export const getDefaultSystemPrompt = (): string => {
  return "You are a creative writing assistant helping the author craft an interactive story. Analyze the reader comments and current story content to suggest improvements. Maintain the style and tone of the story. Format your suggestions in the same structure as the story JSON.";
};

// Generate content using OpenAI API
export const generateContent = async (
  systemPrompt: string,
  fullPrompt: string,
  llmType: "node" | "choices",
  model: string = "gpt-4o-mini",
  temperature: number = 0.7
) => {
  const response = await fetch("/api/generate-story-content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemPrompt,
      prompt: fullPrompt,
      contentType: llmType,
      model,
      temperature
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate content");
  }

  return await response.json();
};

// Prepare prompt data with improved comment formatting
export const preparePromptData = (
  storyData: any,
  currentNode: string,
  currentPage: number,
  comments: any[],
  prompt: string,
  llmType: "node" | "choices",
  commentContext: CommentContextItem[] = []
) => {
  const nodeData = storyData[currentNode] || {
    text: "",
    choices: [],
  };

  // Format regular comments with comment type information
  const commentsText = comments.length > 0
    ? "\nReader comments for this page:\n" + comments.map(c => 
        `- ${c.profile?.username || 'Anonymous'} (${c.comment_type || 'general'}): "${c.content || c.text}"`
      ).join("\n")
    : "\nNo reader comments for this page.";

  // Format selected comment context with proper labels
  const formattedCommentContext = commentContext.length > 0
    ? "\nSelected comments for context:\n" + commentContext.map(item => {
        // Get the proper label from our commentTypeLabels mapping
        const typeLabel = commentTypeLabels[item.type] || item.type;
        return `- ${typeLabel}: "${item.text}" (by ${item.username})`;
      }).join("\n")
    : "";

  const nodeMappings = generateNodeMappings(storyData);
  const prevPageNum = currentPage > 1 ? currentPage - 1 : null;
  const nextPageNum = currentPage < Object.keys(nodeMappings.pageToStoryNodeMap).length ? currentPage + 1 : null;
  
  const prevNodeName = prevPageNum ? nodeMappings.pageToStoryNodeMap[prevPageNum] : null;
  const nextNodeName = nextPageNum ? nodeMappings.pageToStoryNodeMap[nextPageNum] : null;
  
  const prevNodeText = prevNodeName && storyData[prevNodeName] ? 
    `\nPrevious page content: "${storyData[prevNodeName].text}"` : '';
    
  const nextNodeText = nextNodeName && storyData[nextNodeName] ? 
    `\nNext page content: "${storyData[nextNodeName].text}"` : '';

  // Story context section
  const storyContextSection = `
CURRENT STORY CONTEXT:
Page Number: ${currentPage}
Node Name: ${currentNode}
Current Text: "${nodeData.text}"
Current Choices: ${JSON.stringify(nodeData.choices, null, 2)}
${prevNodeText}
${nextNodeText}
`;

  return `
${storyContextSection}
${commentsText}
${formattedCommentContext}

User instruction: ${prompt}
`;
};

// Import from storyUtils to avoid circular imports
import { generateNodeMappings } from "@/lib/storyUtils";
