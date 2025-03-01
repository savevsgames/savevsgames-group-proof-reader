
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserProfileForm } from '@/components/UserProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MainHeader } from '@/components/MainHeader';

const Profile = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not logged in and not loading
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
      <MainHeader />
      
      <div className="flex-1 pt-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6 text-[#3A2618] hover:bg-[#3A2618]/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Library
          </Button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-serif font-bold text-[#3A2618] mb-8">Profile Settings</h1>
            
            {isLoading ? (
              <div className="w-full max-w-md mx-auto bg-[#E8DCC4] rounded-lg shadow-md p-6 mb-8 flex flex-col items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-[#F97316] border-t-transparent rounded-full"></div>
                <p className="mt-4 text-[#3A2618]">Loading profile...</p>
              </div>
            ) : user ? (
              <UserProfileForm />
            ) : (
              <div className="bg-[#E8DCC4] rounded-lg shadow p-8 text-center">
                <p className="text-[#3A2618] mb-4">Please sign in to access your profile.</p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-[#F97316] text-white hover:bg-[#F97316]/90"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
