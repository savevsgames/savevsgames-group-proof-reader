
import React, { useEffect, useState } from "react";
import { CustomStory, convertJSONToInk } from "@/lib/storyUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InkViewProps {
  storyData: CustomStory;
}

const InkView: React.FC<InkViewProps> = ({ storyData }) => {
  const [inkContent, setInkContent] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (storyData) {
      const convertedInk = convertJSONToInk(storyData);
      setInkContent(convertedInk);
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
        </div>
      </div>

      <ScrollArea className="h-[500px] border rounded-md p-4 bg-gray-50 font-mono text-sm">
        <pre className="whitespace-pre-wrap">{inkContent}</pre>
      </ScrollArea>
    </div>
  );
};

export default InkView;
