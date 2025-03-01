
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmptyState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-16 bg-white shadow-md rounded-lg">
      <p className="text-[#3A2618]">No story data found. Please select another story.</p>
      <Button 
        variant="link" 
        className="mt-4"
        onClick={() => navigate('/dashboard')}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};

export default EmptyState;
