import { useState, useEffect } from 'react';
import { Story } from 'inkjs';
import { useToast } from '@/hooks/use-toast';
import {
  CustomStory,
  fetchBookDetails,
  fetchStoryContent
} from '@/lib/storyUtils';
import { 
  extractAllNodesFromInkJSON, 
  extractCustomStoryFromInkJSON
} from '@/lib/storyMapping';
import { generateAndLogNodeMappings, type NodeMappings } from '@/lib/storyEditorUtils';

interface UseStoryLoadingResult {
  story: Story | null;
  customStory: CustomStory | null;
  usingCustomFormat: boolean;
  bookTitle: string;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  nodeMappings: NodeMappings;
}

export const useStoryLoading = (storyId: string | undefined): UseStoryLoadingResult => {
  const [story, setStory] = useState<Story | null>(null);
  const [customStory, setCustomStory] = useState<CustomStory | null>(null);
  const [usingCustomFormat, setUsingCustomFormat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('Untitled Story');
  const [totalPages, setTotalPages] = useState(1);
  const [nodeMappings, setNodeMappings] = useState<NodeMappings>({
    nodeToPage: {},
    pageToNode: {}
  });
  const { toast } = useToast();

  useEffect(() => {
    const initializeStory = async () => {
      if (!storyId) {
        setError('No story ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const bookData = await fetchBookDetails(storyId);
        
        console.log("Fetched book data:", bookData);
        
        if (bookData.title) {
          setBookTitle(bookData.title);
        }

        if (bookData.story_url) {
          await loadStoryContent(bookData.story_url, storyId);
        } else {
          throw new Error('This book has no story content URL');
        }
      } catch (err: any) {
        console.error("Error in initializeStory:", err);
        setError(err.message || 'Failed to load story');
        setIsLoading(false);
        toast({
          title: "Error",
          description: err.message || "Failed to load story",
          variant: "destructive"
        });
      }
    };

    initializeStory();
  }, [storyId, toast]);

  const loadStoryContent = async (storyUrl: string, sid: string) => {
    try {
      console.log("Fetching story from URL:", storyUrl);
      const storyData = await fetchStoryContent(storyUrl);
      console.log("Story data loaded successfully");

      if (storyData.inkVersion) {
        console.log("Detected Ink.js story format (version:", storyData.inkVersion, ")");
        try {
          const newStory = new Story(storyData);
          setStory(newStory);
          setUsingCustomFormat(false);
          
          console.log("Beginning conversion to custom format for analysis...");
          const customStoryData = extractCustomStoryFromInkJSON(storyData);
          console.log("Converted Ink story to custom format with", 
                      Object.keys(customStoryData).length, "nodes");
          
          try {
            console.log("Analyzing story structure...");
            const { nodeMappings: mappings, totalPages: calculatedPages } = 
              generateAndLogNodeMappings(customStoryData);
            
            console.log("Story structure analysis successful:", 
              { totalPages: calculatedPages, mappingCount: Object.keys(mappings.nodeToPage).length });
            
            const nodeCount = Object.keys(customStoryData).filter(key => 
              key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
            ).length;
            
            const mappedNodeCount = Object.keys(mappings.nodeToPage).length;
            
            if (mappedNodeCount < nodeCount * 0.7) { // If we mapped less than 70% of nodes, log a warning
              console.warn(`Mapping only covered ${mappedNodeCount} of ${nodeCount} nodes (${
                Math.round(mappedNodeCount/nodeCount*100)}%)`);
            }
            
            setNodeMappings(mappings);
            setTotalPages(calculatedPages);
            setCustomStory(customStoryData);
          } catch (analysisErr) {
            console.error("Error in story structure analysis:", analysisErr);
            
            const allNodes = extractAllNodesFromInkJSON(storyData);
            console.log("Extracted", allNodes.length, "nodes from story");
            
            const contentNodes = allNodes.filter(node => 
              node !== 'inkVersion' && node !== 'listDefs' && node !== '#f'
            );
            
            setTotalPages(Math.max(contentNodes.length, 1));
            console.warn("Using fallback page count:", contentNodes.length);
            
            const nodeToPage: Record<string, number> = {};
            const pageToNode: Record<number, string> = {};
            
            contentNodes.forEach((node, index) => {
              const pageNum = index + 1;
              nodeToPage[node] = pageNum;
              pageToNode[pageNum] = node;
            });
            
            setNodeMappings({ nodeToPage, pageToNode });
          }
          
          setIsLoading(false);
        } catch (storyError: any) {
          console.error('Error initializing inkjs story:', storyError);
          throw new Error(`Error loading story: ${storyError.message}`);
        }
      } 
      else if ((storyData.start && storyData.start.text) || 
               (storyData.root && typeof storyData.root === 'object')) {
        console.log("Using custom story format");
        setUsingCustomFormat(true);
        setCustomStory(storyData);
        
        try {
          console.log("Analyzing custom story structure for node mappings...");
          const { nodeMappings: mappings, totalPages: calculatedPages } = 
            generateAndLogNodeMappings(storyData);
          
          setNodeMappings(mappings);
          setTotalPages(calculatedPages);
          console.log("Node mapping successful:", 
            { totalPages: calculatedPages, mappings });
          
          setIsLoading(false);
        } catch (err) {
          console.error("Failed to analyze story structure:", err);
          setError(`Failed to analyze story structure: ${err}`);
          setIsLoading(false);
        }
      } else {
        throw new Error('Unsupported story format');
      }
    } catch (error: any) {
      console.error('Error loading story content:', error);
      setError(`Failed to load story content: ${error.message}`);
      setIsLoading(false);
      toast({
        title: "Story Error",
        description: `There was an issue loading the story: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return {
    story,
    customStory,
    usingCustomFormat,
    bookTitle,
    isLoading,
    error,
    totalPages,
    nodeMappings
  };
};
