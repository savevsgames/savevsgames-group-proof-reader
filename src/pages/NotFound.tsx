import React from 'react';
import { Link } from 'react-router-dom';
import { MainHeader } from '@/components/MainHeader';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
      <MainHeader />
      
      <div className="flex flex-col items-center justify-center flex-grow">
        <h1 className="text-4xl font-bold text-[#3A2618] mb-4">404 - Not Found</h1>
        <p className="text-lg text-[#3A2618]/70 mb-8">The page you are looking for does not exist.</p>
        <Link to="/" className="text-[#F97316] hover:underline">
          Go back to the homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
