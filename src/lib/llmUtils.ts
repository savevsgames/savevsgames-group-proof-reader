
import { supabase } from "@/lib/supabase";
import { fetchComments } from "@/lib/storyUtils";

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
  llmType: "node" | "choices"
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
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate content");
  }

  return await response.json();
};

// Prepare prompt data
export const preparePromptData = (
  storyData: any,
  currentNode: string,
  currentPage: number,
  comments: any[],
  prompt: string,
  llmType: "node" | "choices"
) => {
  const nodeData = storyData[currentNode] || {
    text: "",
    choices: [],
  };

  const commentsText = comments.length > 0
    ? "\nReader comments for this page:\n" + comments.map(c => 
        `- ${c.profile?.username || 'Anonymous'}: "${c.content}"`
      ).join("\n")
    : "\nNo reader comments for this page.";

  const nodeMappings = generateNodeMappings(storyData);
  const prevPageNum = currentPage > 1 ? currentPage - 1 : null;
  const nextPageNum = currentPage < Object.keys(nodeMappings.pageToStoryNodeMap).length ? currentPage + 1 : null;
  
  const prevNodeName = prevPageNum ? nodeMappings.pageToStoryNodeMap[prevPageNum] : null;
  const nextNodeName = nextPageNum ? nodeMappings.pageToStoryNodeMap[nextPageNum] : null;
  
  const prevNodeText = prevNodeName && storyData[prevNodeName] ? 
    `\nPrevious page content: "${storyData[prevNodeName].text}"` : '';
    
  const nextNodeText = nextNodeName && storyData[nextNodeName] ? 
    `\nNext page content: "${storyData[nextNodeName].text}"` : '';

  return `
Story node: "${currentNode}" (Page ${currentPage})
Current text: "${nodeData.text}"
Current choices: ${JSON.stringify(nodeData.choices, null, 2)}
${prevNodeText}
${nextNodeText}
${commentsText}

User instruction: ${prompt}
`;
};

// Import from storyUtils to avoid circular imports
import { generateNodeMappings } from "@/lib/storyUtils";
