import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainHeader } from '@/components/MainHeader';
import { useAuth } from '@/context/AuthContext';
import { BookOpenCheck, BookPlus, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/stories`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStories(data);
      } catch (error) {
        console.error("Could not fetch stories:", error);
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
              <Input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="bg-white border-[#3A2618]/20 text-[#3A2618] pr-10"
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
              {!searchTerm && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-[#3A2618]/50" />
                </div>
              )}
            </div>
            {!isGuest && (
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
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-[#F97316] animate-spin" />
              <span className="ml-2 text-[#3A2618]">Loading stories...</span>
            </div>
          ) : (
            <ScrollArea className="rounded-md border">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4">
                {filteredStories.map(story => (
                  <Card key={story.id} className="bg-[#E8DCC4] text-[#3A2618]">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold line-clamp-1">{story.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{story.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <img
                        src={story.cover_url}
                        alt={story.title}
                        className="w-full h-32 object-cover rounded-md mb-4"
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
                {filteredStories.length === 0 && (
                  <div className="text-center text-[#3A2618]/70 col-span-full">
                    No stories found.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
