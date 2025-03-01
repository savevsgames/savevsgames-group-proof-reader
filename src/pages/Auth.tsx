import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, continueAsGuest } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp && !username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to sign up.",
        variant: "destructive",
      });
      setIsLoading(false);
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
        toast({
          title: "Authentication failed",
          description: result.error.message || "An error occurred during authentication.",
          variant: "destructive",
        });
      } else {
        // Redirect on successful sign-in/sign-up is handled by the AuthContext listener
        // which listens for auth state changes and redirects to /dashboard
        // No need to navigate here
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
      <MainHeader />
      
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#E8DCC4] rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-serif font-bold text-[#3A2618] text-center mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
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
              disabled={isLoading}
            >
              {isLoading ? (isSignUp ? 'Creating...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
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
              onClick={() => {
                continueAsGuest();
                navigate('/dashboard');
              }}
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
