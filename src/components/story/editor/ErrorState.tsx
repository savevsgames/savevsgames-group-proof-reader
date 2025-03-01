
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ErrorStateProps {
  errorMessage: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage }) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-red-50 border border-red-300 rounded-md p-4 my-8">
      <p className="text-red-700">{errorMessage}</p>
      <Button 
        variant="link" 
        className="text-red-700 p-0 mt-2"
        onClick={() => navigate('/dashboard')}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};

export default ErrorState;
