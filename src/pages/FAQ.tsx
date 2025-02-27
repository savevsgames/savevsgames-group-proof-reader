
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronLeft } from 'lucide-react';

const FAQ = () => {
  const faqs = [
    {
      question: "What is saveVSgames?",
      answer: "saveVSgames is an interactive adventure story platform where readers can make choices that affect the outcome of the narrative. Our flagship project follows the adventures on Shadowtide Island, an immersive fantasy world where your decisions shape the story."
    },
    {
      question: "How do the interactive stories work?",
      answer: "Our stories present you with narrative passages followed by choices. Each choice you make branches the story in different directions, creating a unique reading experience. You can also go back and try different paths to see how your choices affect the outcome."
    },
    {
      question: "How often are new chapters released?",
      answer: "New chapters are typically released monthly, though this can vary depending on the complexity of the storyline. Subscribers receive notifications when new content is available."
    },
    {
      question: "Can I contribute to the stories?",
      answer: "Yes! We have a proofreading program where authenticated users can preview upcoming chapters and provide feedback. This helps us refine the narrative and ensure the best possible experience for all readers."
    },
    {
      question: "What makes Shadowtide Island unique?",
      answer: "Shadowtide Island combines elements of classic fantasy with original worldbuilding. The island contains ancient ruins, mysterious forests, and hidden dangers, all waiting to be discovered through your choices in the narrative."
    }
  ];

  return (
    <div className="min-h-screen bg-[#3A2618] flex flex-col">
      {/* Header */}
      <header className="bg-[#2E1D11] text-[#E8DCC4] py-6 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-[#F97316] hover:text-[#E86305] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/2386c015-8e81-4433-9997-ae0f0b94bb6a.png" 
              alt="saveVSgames logo" 
              className="h-8 w-8"
            />
            <span className="text-[#F97316] font-serif text-xl">saveVSgames</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#F97316] mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-[#E8DCC4] opacity-90 max-w-xl mx-auto">
              Learn more about saveVSgames and our adventure on Shadowtide Island
            </p>
          </div>

          <div className="space-y-8 mb-12">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border-b border-[#E8DCC4]/20 pb-6 last:border-b-0"
              >
                <h3 className="text-xl md:text-2xl font-serif font-medium text-[#F97316] mb-3">
                  {faq.question}
                </h3>
                <p className="text-[#E8DCC4] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[#2E1D11] rounded-lg p-6 text-center">
            <h3 className="text-xl font-serif text-[#F97316] mb-3">
              Want to join our proofreading program?
            </h3>
            <p className="text-[#E8DCC4] mb-6">
              Help shape the future of our stories by providing feedback on upcoming chapters.
            </p>
            <Link 
              to="/auth" 
              className="inline-flex items-center bg-[#F97316] hover:bg-[#E86305] transition-colors text-[#E8DCC4] px-6 py-3 rounded-md font-medium"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Sign Up as a Proofreader
            </Link>
          </div>
        </div>
      </main>

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

export default FAQ;
