
import React, { useEffect, useState } from "react";
import { CustomStory, convertJSONToInk } from "@/lib/storyUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Copy, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Story } from "inkjs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface InkViewProps {
  storyData: CustomStory;
}

const InkView: React.FC<InkViewProps> = ({ storyData }) => {
  const [inkContent, setInkContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("code");
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [previewChoices, setPreviewChoices] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (storyData) {
      try {
        const convertedInk = convertJSONToInk(storyData);
        setInkContent(convertedInk);
      } catch (err) {
        console.error("Error converting JSON to Ink:", err);
      }
    }
  }, [storyData]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inkContent);
      toast({
        title: "Copied to clipboard",
        description: "The Ink code has been copied to your clipboard.",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([inkContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "story.ink";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewStory = () => {
    try {
      // We would use inkjs to compile and run the story
      // But for now, let's just show a preview of what that would look like
      setActiveTab("preview");
      setPreviewText("This feature is coming soon! It will allow you to interactively test your story directly in the editor.");
      setPreviewChoices(["Continue with preview", "Return to code view"]);
      setPreviewError(null);
      
      toast({
        title: "Preview mode",
        description: "Interactive story preview is under development.",
        duration: 3000,
      });
    } catch (err) {
      setPreviewError(`Failed to preview story: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Preview failed",
        description: "Could not generate a preview of your story.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleChoiceSelection = (index: number) => {
    // In the future, this would progress the story based on the choice
    if (index === 1) {
      setActiveTab("code");
    } else {
      setPreviewText("You selected the first option! In a real implementation, this would continue the story.");
      setPreviewChoices(["Finish preview", "Return to code view"]);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Ink Format</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyToClipboard}
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            title="Download as .ink file"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewStory}
            title="Preview story"
            disabled={activeTab === "preview"}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-0">
          <ScrollArea className="h-[500px] border rounded-md p-4 bg-gray-50 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{inkContent}</pre>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div className="h-[500px] border rounded-md p-4 bg-white flex flex-col">
            {previewError ? (
              <div className="text-red-500 bg-red-50 p-3 rounded-md">{previewError}</div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-gray-50 rounded-md flex-grow">
                  <p>{previewText}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="mb-2 font-medium">Choices:</p>
                  {previewChoices.map((choice, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="mr-2 mb-2"
                      onClick={() => handleChoiceSelection(index)}
                    >
                      {choice}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InkView;
