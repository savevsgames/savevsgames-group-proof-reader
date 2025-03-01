
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Menu, User, LogOut, LogIn, Upload, ChevronLeft } from 'lucide-react';
import { uploadAvatar, getUserProfile } from '@/lib/authUtils';
import { toast } from '@/hooks/use-toast';

interface HeaderProps {
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  showBackButton = false, 
  backTo = '/dashboard',
  backLabel = 'Back to Library'
}) => {
  const { user, isGuest, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isStoryPage = location.pathname.includes('/story/');
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && !isGuest) {
        const { profile, error } = await getUserProfile(user.id);
        if (!error && profile && profile.avatar_url) {
          console.log('[Header] Fetched avatar URL:', profile.avatar_url);
          setAvatarUrl(profile.avatar_url);
        }
      }
    };
    
    fetchUserProfile();
  }, [user, isGuest]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    toast({
      title: "Uploading avatar...",
      description: "Please wait while we upload your image.",
    });
    
    const { publicUrl, error } = await uploadAvatar(file, user.id);
    
    if (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your avatar. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setAvatarUrl(publicUrl);
    toast({
      title: "Avatar updated",
      description: "Your profile picture has been updated successfully.",
    });
  };
  
  const handleAvatarClick = () => {
    document.getElementById('avatar-upload')?.click();
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className={`bg-[#3A2618] text-[#E8DCC4] py-4 px-6 shadow-md ${isStoryPage ? '' : 'mb-4'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <Button 
              onClick={() => navigate(backTo)}
              variant="ghost" 
              className="text-[#E8DCC4] hover:text-[#F97316] transition-colors mr-4"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              {backLabel}
            </Button>
          )}
          
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/lovable-uploads/2386c015-8e81-4433-9997-ae0f0b94bb6a.png"
              alt="saveVSgames logo"
              className="h-8 w-8"
            />
            <div>
              <h1 className="text-xl font-serif font-bold text-[#F97316]">
                saveVSgames
              </h1>
              <p className="text-xs text-[#E8DCC4] hidden sm:block">
                Adventures on Shadowtide Island
              </p>
            </div>
          </Link>
        </div>
        
        <div className="md:flex items-center space-x-4 hidden">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  {isGuest ? 'Guest User' : user.username || user.email}
                </div>
                
                {!isGuest && (
                  <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                    <Avatar className="h-10 w-10 border-2 border-[#F97316] group-hover:border-white transition-colors">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="User avatar" />
                      ) : (
                        <AvatarFallback className="bg-[#F97316] text-[#E8DCC4]">
                          <Upload className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all">
                      <Upload className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                className="text-[#E8DCC4] hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => navigate('/auth')} 
              variant="default" 
              className="bg-[#F97316] hover:bg-[#E86305]"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
        
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-[#E8DCC4]"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-16 right-4 bg-[#2E1D11] rounded-md shadow-lg z-50 p-4 w-64">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-[#E8DCC4]/20">
                {!isGuest && (
                  <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-10 w-10 border-2 border-[#F97316]">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="User avatar" />
                      ) : (
                        <AvatarFallback className="bg-[#F97316] text-[#E8DCC4]">
                          <Upload className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <input
                      id="avatar-upload-mobile"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
                <div>
                  <div className="font-medium">{isGuest ? 'Guest User' : user.username || user.email}</div>
                  {!isGuest && (
                    <div className="text-xs text-[#E8DCC4]/70">Tap avatar to upload photo</div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                className="w-full justify-start text-[#E8DCC4]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => navigate('/auth')} 
              variant="default" 
              className="w-full justify-start bg-[#F97316] hover:bg-[#E86305]"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
