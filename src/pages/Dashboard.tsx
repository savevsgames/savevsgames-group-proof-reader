
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainHeader } from '@/components/MainHeader';
import { useAuth } from '@/context/useAuth';
import { BookOpenCheck, BookPlus, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface Story {
  id: string;
  title: string;
  description: string;
  cover_url: string;
}

const Dashboard = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        console.log("Fetching stories from Supabase...");
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*');

        if (booksError) {
          console.error("Error fetching books:", booksError);
          throw booksError;
        }

        console.log("Books data received:", booksData);
        
        if (!booksData || booksData.length === 0) {
          console.log("No books found in the database");
          setStories([]);
          setLoading(false);
          return;
        }

        const formattedStories = booksData.map(book => ({
          id: book.id,
          title: book.title || 'Untitled Story',
          description: book.subtitle || 'No description available',
          cover_url: book.cover_url || '/placeholder.svg'
        }));

        console.log("Formatted stories:", formattedStories);
        setStories(formattedStories);
      } catch (error) {
        console.error("Could not fetch stories:", error);
        toast.error("Failed to load stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
      <MainHeader />
      
      <div className="flex-1 pt-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center">
            <h1 className="text-3xl font-serif font-bold text-[#3A2618] mr-4">Library</h1>
            {isGuest && (
              <span className="text-sm text-[#3A2618]/70 italic">
                (Browsing as guest)
              </span>
            )}
          </div>

          <div className="mb-6 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3A2618]/50" />
              <Input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="bg-white border-[#3A2618]/20 text-[#3A2618] pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-[#3A2618]/10"
                >
                  <X className="h-4 w-4 text-[#3A2618]" />
                </Button>
              )}
            </div>
            {isAuthenticated && !isGuest && (
              <Button
                onClick={() => navigate('/story/new')}
                className="bg-[#F97316] text-white hover:bg-[#F97316]/90"
              >
                <BookPlus className="h-4 w-4 mr-2" />
                Add Story
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-[#F97316] animate-spin" />
              <span className="ml-2 text-[#3A2618]">Loading stories...</span>
            </div>
          ) : (
            <div className="rounded-md border border-[#3A2618]/20 bg-white p-4">
              {filteredStories.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filteredStories.map(story => (
                    <Card key={story.id} className="bg-[#E8DCC4] text-[#3A2618] hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold line-clamp-1">{story.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{story.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <img
                          src={story.cover_url}
                          alt={story.title}
                          className="w-full h-32 object-cover rounded-md mb-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <Link to={`/story/${story.id}`}>
                          <Button className="bg-[#F97316] text-white hover:bg-[#F97316]/90">
                            Read More <BookOpenCheck className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#3A2618]/70 py-8">
                  {searchTerm ? 'No stories match your search.' : 'No stories available. Check back later!'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
