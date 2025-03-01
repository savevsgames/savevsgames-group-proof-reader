
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LlmOutputProps {
  output: string;
}

const LlmOutput: React.FC<LlmOutputProps> = ({ output }) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">LLM Output</h3>
      <ScrollArea className="flex-grow bg-gray-50 p-3 rounded border max-h-[350px]">
        {output ? (
          <div className="whitespace-pre-wrap font-mono text-sm">
            {output}
          </div>
        ) : (
          <div className="text-gray-400 italic text-center mt-8">
            Generated content will appear here
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LlmOutput;
