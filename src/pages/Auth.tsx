
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, signIn, signUp, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        if (!username) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        
        if (username.length < 3) {
          setError('Username must be at least 3 characters');
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, username);
        
        if (error) {
          // Handle specific error cases
          if (error.message.includes('email')) {
            setError('This email is already in use. Please try another one or sign in.');
          } else if (error.message.includes('username')) {
            setError('This username is already taken. Please choose another one.');
          } else {
            setError(error.message || 'An error occurred during sign up');
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password');
          } else {
            setError(error.message || 'Invalid email or password');
          }
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#3A2618] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/2386c015-8e81-4433-9997-ae0f0b94bb6a.png" 
              alt="saveVSgames logo" 
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#F97316] mb-2">saveVSgames</h1>
          <p className="text-[#E8DCC4] opacity-75">Adventures on Shadowtide Island</p>
        </div>

        <div className="bg-[#E8DCC4] rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-serif font-semibold text-[#3A2618] mb-6 text-center">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#3A2618] mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-[#3A2618]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  placeholder="Choose a unique username"
                  required
                />
                <p className="mt-1 text-xs text-[#3A2618]/70">
                  Must be at least 3 characters long and will be visible to other users
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#3A2618] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#3A2618]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#3A2618] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#3A2618]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
                required
              />
              {isSignUp && (
                <p className="mt-1 text-xs text-[#3A2618]/70">
                  Must be at least 6 characters long
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#F97316] text-[#E8DCC4] py-2 rounded-md font-medium hover:bg-[#E86305] transition-colors duration-200 mt-6 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2">Loading...</span>
                  <span className="animate-spin h-4 w-4 border-2 border-[#E8DCC4] border-t-transparent rounded-full"></span>
                </>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[#3A2618] hover:text-[#F97316] transition-colors duration-200"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#3A2618]/10 text-center">
            <button
              onClick={handleGuestAccess}
              className="text-sm text-[#3A2618] font-medium hover:text-[#F97316] transition-colors duration-200"
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
