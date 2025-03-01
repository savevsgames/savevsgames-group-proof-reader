
import { generateNodeMappings } from "@/lib/storyUtils";
import { formatCommentContext, formatPageComments, CommentContextItem } from "./commentContext";
import { CommentType } from "@/lib/commentTypes";

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

  return `
${storyContextSection}
${commentsText}
${formattedCommentContext}

User instruction: ${prompt}
`;
};
