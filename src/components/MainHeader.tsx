
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Book, BookOpen, Home, LogIn, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MainHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-[#3A2618] text-white py-4 px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="font-serif text-xl font-bold flex items-center">
            <BookOpen className="h-6 w-6 mr-2" />
            <span>Storytale Adventures</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-1">
            <Button 
              asChild 
              variant={isActive('/') ? "secondary" : "ghost"}
              className="text-white"
            >
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant={isActive('/dashboard') ? "secondary" : "ghost"}
              className="text-white"
            >
              <Link to="/dashboard">
                <Book className="h-4 w-4 mr-2" />
                Library
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant={isActive('/faq') ? "secondary" : "ghost"}
              className="text-white"
            >
              <Link to="/faq">
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ
              </Link>
            </Button>
          </nav>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full h-9 w-9 p-0 text-white">
                  <Avatar className="h-9 w-9 border border-white/30">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.username || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-[#F97316]/90 text-white">
                        {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex cursor-pointer items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex cursor-pointer items-center">
                    <Book className="mr-2 h-4 w-4" />
                    <span>My Library</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()} 
                  className="text-red-600 cursor-pointer"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="secondary" className="bg-[#F97316] text-white hover:bg-[#F97316]/90">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
