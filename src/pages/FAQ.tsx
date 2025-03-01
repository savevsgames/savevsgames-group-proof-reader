import React from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import Header from "@/components/Header";

const FAQ = () => {
  const faqs = [
    {
      question: "What is saveVSgames?",
      answer:
        "saveVSgames isn't just my GitHub profile name. Its also the name of the organization that I create RPG focused content under. I am writing my first novel Shadowtide Island, and saveVSgames will then adapt it into multiple media types, including a browser based game and TTRPG adventure book.",
    },
    {
      question: "How do the interactive stories work?",
      answer:
        "You can comment on any page while signed in, allowing the writer to see your notes when they have the work edited.",
    },
    {
      question: "How often are new chapters released?",
      answer:
        "New chapters/parts will typically be released monthly, though this can vary depending on the complexity of the storyline.",
    },
    {
      question: "Can I contribute to the stories?",
      answer:
        "Yes! We have a proofreading program where authenticated users can comment on each page to provide feedback. This helps me refine the narrative and ensure the best possible story and experience for all readers.",
    },
    {
      question: "What makes Shadowtide Island unique?",
      answer:
        "Shadowtide Island combines elements of classic fantasy with original worldbuilding. The island contains ancient ruins, mysterious forests, and hidden dangers, all waiting to be discovered through the telling of Kavan's story.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#3A2618] flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#F97316] mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-[#E8DCC4] opacity-90 max-w-xl mx-auto">
              Learn more about saveVSgames and our adventure on Shadowtide
              Island
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
                <p className="text-[#E8DCC4] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#2E1D11] rounded-lg p-6 text-center">
            <h3 className="text-xl font-serif text-[#F97316] mb-3">
              Want to join our proofreading program?
            </h3>
            <p className="text-[#E8DCC4] mb-6">
              Help shape the future of our stories by providing feedback on
              upcoming chapters.
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
