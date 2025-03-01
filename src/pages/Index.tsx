import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/MainHeader';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
      <MainHeader />
      
      <main className="flex-grow flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-serif font-bold text-[#3A2618] sm:text-5xl mb-6">
            Welcome to Storytale Adventures
          </h1>
          <p className="text-lg text-[#3A2618]/80 mb-8">
            Embark on a journey of endless stories. Create, explore, and share your own adventures.
          </p>
          <div className="space-x-4">
            <Button asChild className="bg-[#F97316] text-white hover:bg-[#F97316]/90">
              <Link to="/dashboard">Explore Stories</Link>
            </Button>
            <Button variant="outline" className="text-[#3A2618] hover:bg-[#3A2618]/10">
              <Link to="/faq">Learn More</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="bg-[#E8DCC4] text-[#3A2618] text-center py-4">
        <p className="text-sm">
          © {new Date().getFullYear()} Storytale Adventures. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
