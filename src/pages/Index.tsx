
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, ChevronRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#3A2618] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="mb-8">
          <img 
            src="/lovable-uploads/2386c015-8e81-4433-9997-ae0f0b94bb6a.png" 
            alt="saveVSgames logo" 
            className="h-32 w-32 mx-auto"
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#F97316] mb-4">
          saveVSgames
        </h1>
        <p className="text-xl md:text-2xl text-[#E8DCC4] opacity-90 mb-8">
          Adventures on Shadowtide Island
        </p>
        <p className="text-lg md:text-xl text-[#E8DCC4] opacity-80 max-w-xl mb-12">
          Immerse yourself in interactive adventures. Make choices that matter. Experience stories that adapt to your decisions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/auth')}
            className="bg-[#F97316] hover:bg-[#E86305] transition-colors text-[#E8DCC4] px-8 py-3 rounded-md font-medium text-lg flex items-center justify-center"
          >
            Get Started <ChevronRight className="ml-2 h-5 w-5" />
          </button>
          
          <button 
            onClick={() => {
              // Implement learn more functionality
            }}
            className="border border-[#E8DCC4] text-[#E8DCC4] hover:bg-[#E8DCC4]/10 transition-colors px-8 py-3 rounded-md font-medium text-lg"
          >
            Learn More
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-[#2E1D11] text-[#E8DCC4]/70 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <img 
              src="/lovable-uploads/2386c015-8e81-4433-9997-ae0f0b94bb6a.png" 
              alt="saveVSgames logo" 
              className="h-8 w-8 mr-2"
            />
            <span className="text-[#F97316] font-serif">saveVSgames</span>
          </div>
          
          <div className="text-sm">
            © 2023 saveVSgames. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
