
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, isGuest, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user || isGuest) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }
  }, [user, isGuest, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3A2618]">
      <div className="animate-fade-in text-[#E8DCC4] font-serif">Loading...</div>
    </div>
  );
};

export default Index;
