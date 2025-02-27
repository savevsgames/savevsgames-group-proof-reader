
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, isGuest, loading } = useAuth();
  const navigate = useNavigate();
  const [localLoading, setLocalLoading] = useState(true);

  // Add a timeout to prevent infinite loading if auth context has issues
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log("Auth loading timeout, redirecting to auth page");
        setLocalLoading(false);
        navigate('/auth');
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timeout);
  }, [loading, navigate]);

  useEffect(() => {
    if (!loading) {
      setLocalLoading(false);
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
