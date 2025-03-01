
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadAvatar, deleteAvatar, supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function UserProfileForm() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // Used to reset file input

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

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
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Profile updated',
        description: 'Your username has been updated successfully.',
      });
      
      // Refresh the page to update the context
      window.location.reload();
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
        
        <div className="w-full mb-4">
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
