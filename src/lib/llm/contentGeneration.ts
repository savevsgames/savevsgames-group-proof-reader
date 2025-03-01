
import { generateNodeMappings } from "@/lib/storyUtils";
import { formatCommentContext, formatPageComments, CommentContextItem } from "./commentContext";
import { CommentType } from "@/lib/commentTypes";

// Generate content using OpenAI API
export const generateContent = async (
  systemPrompt: string,
  fullPrompt: string,
  llmType: "edit_json" | "story_suggestions",
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
  llmType: "edit_json" | "story_suggestions",
  commentContext: CommentContextItem[] = []
) => {
  const nodeData = storyData[currentNode] || {
    text: "",
    choices: [],
  };

  // Format comments with type information
  const commentsText = formatPageComments(comments);

  // Format selected comment context with proper labels
  const formattedCommentContext = formatCommentContext(commentContext);

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

  // Generate mode-specific instructions
  const modeSpecificInstructions = llmType === "edit_json" 
    ? `IMPORTANT: Provide your response as valid JSON that can be directly used to update the story node.
Format your response as a complete JSON object for the node "${currentNode}" with both "text" and "choices" fields.
Example format:
{
  "text": "The updated story text goes here...",
  "choices": [
    {"text": "First choice text", "target": "target_node_name"},
    {"text": "Second choice text", "target": "another_node_name"}
  ]
}
Make sure your JSON is valid and properly formatted.`
    : `IMPORTANT: You are a creative writing assistant. Provide thoughtful story suggestions, alternative plot directions, character development ideas, and writing prompts.
Format your response in clear sections:
1. Story Analysis: Brief analysis of the current narrative
2. Writing Suggestions: 2-3 specific ways to improve the current text
3. Plot Directions: 2-3 alternative directions the story could take
4. Creative Prompts: 1-2 writing exercises or prompts related to this story section

Be specific, creative, and actionable in your suggestions.`;

  return `
${storyContextSection}
${commentsText}
${formattedCommentContext}

${modeSpecificInstructions}

User instruction: ${prompt}
`;
};
