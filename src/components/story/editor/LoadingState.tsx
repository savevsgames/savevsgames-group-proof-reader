
import React from "react";

const LoadingState: React.FC = () => {
  return (
    <div className="text-center py-16">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F97316] border-r-transparent"></div>
      <p className="mt-4 text-[#3A2618]">Loading story data...</p>
    </div>
  );
};

export default LoadingState;
