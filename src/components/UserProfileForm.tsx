
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { uploadAvatar, deleteAvatar } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

export function UserProfileForm() {
  const { user, profile, signOut, updateProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileInputKey, setFileInputKey] = useState(0); // Used to reset file input

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(user?.email || '');
      setAvatarUrl(profile.avatar_url || null);
      
      // Format the created_at date
      if (profile.created_at) {
        setCreatedAt(format(new Date(profile.created_at), 'MMMM d, yyyy'));
      }
      
      setIsLoading(false);
    } else if (user) {
      // If we have a user but no profile, refresh the profile
      refreshUserProfile().then(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user, profile, refreshUserProfile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    setUploading(true);
    
    try {
      const { url, error } = await uploadAvatar(user.id, file);
      
      if (error) {
        throw error;
      }
      
      if (url) {
        setAvatarUrl(url);
        
        // Update profile with new avatar URL
        await refreshUserProfile();
        
        toast({
          title: 'Avatar updated',
          description: 'Your avatar has been updated successfully.',
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload avatar',
      });
    } finally {
      setUploading(false);
      // Reset file input
      setFileInputKey(prev => prev + 1);
    }
  };
  
  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    
    setUploading(true);
    
    try {
      const { error } = await deleteAvatar(user.id, avatarUrl);
      
      if (error) {
        throw error;
      }
      
      setAvatarUrl(null);
      
      // Update profile after removing avatar
      await refreshUserProfile();
      
      toast({
        title: 'Avatar removed',
        description: 'Your avatar has been removed.',
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to remove avatar',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleUpdateUsername = async () => {
    if (!user) return;
    
    if (!username.trim()) {
      toast({
        variant: 'destructive',
        title: 'Username required',
        description: 'Please enter a username.',
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const result = await updateProfile({ username });
      
      if (result?.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto bg-[#E8DCC4] rounded-lg shadow-md p-6 mb-8 flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#F97316] border-t-transparent rounded-full"></div>
        <p className="mt-4 text-[#3A2618]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#E8DCC4] rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-serif font-bold text-[#3A2618] mb-6">Your Profile</h2>
      
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 border-2 border-[#F97316]">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={username || 'User'} />
            ) : (
              <AvatarFallback className="bg-[#F97316]/10 text-[#F97316]">
                {username ? username.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          
          <div className="flex mt-2 space-x-2 justify-center">
            <label 
              htmlFor="avatar-upload" 
              className="flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-[#F97316] text-white hover:bg-[#F97316]/90 transition-colors cursor-pointer"
            >
              <Camera className="h-4 w-4 mr-1" />
              {avatarUrl ? 'Change' : 'Add'}
              <input
                id="avatar-upload"
                key={fileInputKey}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
            
            {avatarUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="px-3 py-1.5 text-sm border-[#3A2618]/30 text-[#3A2618]"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
        
        <div className="w-full space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#3A2618] mb-1">
              Email
            </label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-white/50 border-[#3A2618]/20 text-[#3A2618]"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#3A2618] mb-1">
              Username
            </label>
            <div className="flex">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white border-[#3A2618]/20 text-[#3A2618]"
                placeholder="Enter your username"
              />
              <Button
                onClick={handleUpdateUsername}
                disabled={saving}
                className="ml-2 bg-[#F97316] text-white hover:bg-[#F97316]/90"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {createdAt && (
            <div>
              <p className="text-sm text-[#3A2618]/70">
                <span className="font-medium">Member since:</span> {createdAt}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Button
        variant="outline"
        onClick={signOut}
        className="w-full border-[#3A2618]/30 text-[#3A2618] hover:bg-[#3A2618]/10"
      >
        Sign Out
      </Button>
    </div>
  );
}
