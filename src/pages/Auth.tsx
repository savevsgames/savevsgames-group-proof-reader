
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainHeader } from '@/components/MainHeader';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const { isAuthenticated, isLoading, error, signIn, signUp, continueAsGuest } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);

    if (isSignUp && !username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to sign up.",
        variant: "destructive",
      });
      setLocalLoading(false);
      return;
    }

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, username);
      } else {
        result = await signIn(email, password);
      }

      if (result?.error) {
        // Error handling is done within the auth functions
      } else if (!isSignUp) {
        // Only redirect on successful sign-in, signup will show verification message
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
      <MainHeader />
      
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#E8DCC4] rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-serif font-bold text-[#3A2618] text-center mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="username" className="text-[#3A2618]">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white border-[#3A2618]/20 text-[#3A2618]"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-[#3A2618]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-[#3A2618]/20 text-[#3A2618]"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[#3A2618]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-[#3A2618]/20 text-[#3A2618]"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#F97316] text-white hover:bg-[#F97316]/90"
              disabled={localLoading || isLoading}
            >
              {localLoading || isLoading ? (
                isSignUp ? 'Creating...' : 'Signing In...'
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </Button>
          </form>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#3A2618] hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
          <div className="text-center mt-2">
            <button
              type="button"
              onClick={handleGuestAccess}
              className="text-[#3A2618] hover:underline"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
