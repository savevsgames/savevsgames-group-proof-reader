
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainHeader } from '@/components/MainHeader';
import { useAuth } from '@/context/useAuth';
import { BookOpenCheck, BookPlus, Loader2, Search, X, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [queryResponse, setQueryResponse] = useState<any>(null);
  const { isAuthenticated, isGuest } = useAuth();
  const navigate = useNavigate();

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching stories from Supabase...");
      
      // Log detailed auth state
      console.log("Auth state:", { isAuthenticated, isGuest });
      
      // Verify Supabase connection
      try {
        // Test if supabase is configured properly
        const { data: connectionTest, error: connectionError } = await supabase.from('books').select('count(*)', { count: 'exact', head: true });
        
        console.log("Connection test:", { data: connectionTest, error: connectionError });
        
        if (connectionError) {
          console.error("Supabase connection test failed:", connectionError);
          toast.error("Database connection test failed");
          setError(`Connection error: ${connectionError.message}`);
          setLoading(false);
          return;
        }
      } catch (connectionTestError) {
        console.error("Failed to test Supabase connection:", connectionTestError);
      }
      
      // Perform the actual query with more details
      console.log("Executing books query with explicit parameters...");
      
      const query = supabase
        .from('books')
        .select('*');
      
      console.log("Executing query:", query);
      
      const { data: booksData, error: booksError } = await query;
      
      // Store complete query response for debugging
      setQueryResponse({ data: booksData, error: booksError });
      
      console.log("Raw response from Supabase:", { data: booksData, error: booksError });
      
      if (booksError) {
        console.error("Error fetching books:", booksError);
        setError(`Failed to fetch books: ${booksError.message}`);
        toast.error(`Failed to fetch books: ${booksError.message}`);
        setLoading(false);
        return;
      }
      
      // Store the raw data for debugging
      setRawData(booksData);
      
      if (!booksData) {
        console.log("No data returned from books table");
        setStories([]);
        setLoading(false);
        return;
      }
      
      console.log("Books data received:", booksData);
      console.log("Number of books fetched:", booksData.length);
      
      if (booksData.length === 0) {
        console.log("The books table exists but is empty");
        toast.info("No stories found in the database");
        setStories([]);
        setLoading(false);
        return;
      }
      
      // Log each book to check their structure
      booksData.forEach((book, index) => {
        console.log(`Book ${index + 1}:`, book);
        console.log(`- ID: ${book.id}`);
        console.log(`- Title: ${book.title}`);
        console.log(`- Subtitle: ${book.subtitle}`);
        console.log(`- Cover URL: ${book.cover_url}`);
      });
      
      const formattedStories = booksData.map(book => {
        console.log("Processing book:", book);
        
        if (!book.id) console.warn("Book missing ID:", book);
        if (!book.title) console.warn("Book missing title:", book);
        
        const story = {
          id: book.id || 'missing-id',
          title: book.title || 'Untitled Story',
          description: book.subtitle || 'No description available',
          cover_url: book.cover_url || '/placeholder.svg'
        };
        console.log("Formatted story:", story);
        return story;
      });
      
      console.log("Final formatted stories array:", formattedStories);
      setStories(formattedStories);
    } catch (error: any) {
      console.error("Could not fetch stories:", error);
      setError(`Failed to load stories: ${error.message}`);
      toast.error(`Failed to load stories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if supabase is initialized correctly
    if (!supabase) {
      console.error("Supabase client is not initialized");
      setError("Database connection is not available");
      setLoading(false);
      return;
    }

    fetchStories();
  }, [isAuthenticated, isGuest]);

  // Function to try and diagnose database issues
  const diagnoseDbIssues = async () => {
    try {
      toast.info("Running database diagnostics...");
      console.log("Running database diagnostics...");
      
      // Check Supabase instance
      console.log("Testing connection to Supabase API...");
      
      // Try a simple health check
      console.log("Testing connection to Supabase...");
      const { data: healthCheck, error: healthError } = await supabase
        .from('books')
        .select('count(*)', { count: 'exact', head: true });
      
      console.log("Health check results:", { healthCheck, healthError });
      
      // List available tables
      console.log("Checking for available tables...");
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .rpc('get_schema_info');
        
        console.log("Table information:", { data: tableInfo, error: tableError });
        
        if (tableError) {
          console.log("Couldn't get table information, trying alternative method");
          const { data: tables } = await supabase
            .from('pg_tables')
            .select('*')
            .eq('schemaname', 'public');
          
          console.log("Alternative table list:", tables);
        }
      } catch (e) {
        console.error("Error retrieving schema info:", e);
      }
      
      // Check if the books table exists
      console.log("Checking if 'books' table exists...");
      const { data: booksCheck, error: booksCheckError } = await supabase
        .from('books')
        .select('id')
        .limit(1);
      
      console.log("Books table check:", { 
        data: booksCheck, 
        error: booksCheckError,
        tableExists: !booksCheckError || booksCheckError.code !== "PGRST116"
      });
      
      // Check specific RLS policies if needed
      console.log("Checking logged-in user permissions...");
      const { data: userInfo, error: userError } = await supabase.auth.getUser();
      console.log("Current user:", { data: userInfo, error: userError });
      
      if (userInfo?.user) {
        console.log("Authenticated user found, testing book access...");
        const { data: authTest, error: authError } = await supabase
          .from('books')
          .select('id')
          .limit(1);
        
        console.log("Authenticated access test:", { data: authTest, error: authError });
      }

      toast.success("Diagnostics complete. Check browser console for details.");
    } catch (error) {
      console.error("Diagnostics failed:", error);
      toast.error("Failed to run diagnostics");
    }
  };

  // Function to add a test book to the database
  const addTestBook = async () => {
    try {
      toast.info("Adding a test book to the database...");
      
      const testBook = {
        title: "Test Book " + Math.floor(Math.random() * 1000),
        subtitle: "This is an automatically created test book",
        cover_url: "/placeholder.svg",
        story_file: "placeholder-dog-story.json",
        total_pages: 10
      };
      
      const { data, error } = await supabase
        .from('books')
        .insert(testBook)
        .select();
      
      console.log("Test book insert result:", { data, error });
      
      if (error) {
        toast.error(`Failed to add test book: ${error.message}`);
      } else {
        toast.success("Test book added successfully!");
        // Refresh the list
        fetchStories();
      }
    } catch (error: any) {
      console.error("Error adding test book:", error);
      toast.error(`Failed to add test book: ${error.message}`);
    }
  };

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
            
            <Button
              onClick={fetchStories}
              variant="outline"
              className="border-[#3A2618]/20 text-[#3A2618]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
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
          ) : error ? (
            <div className="p-6 text-center text-red-600 bg-white rounded-md border border-[#3A2618]/20">
              <p>{error}</p>
              <p className="mt-2">Please check the console for more details.</p>
              <div className="mt-4 flex justify-center space-x-4">
                <Button onClick={diagnoseDbIssues} className="bg-[#3A2618] hover:bg-[#3A2618]/80">
                  <Database className="h-4 w-4 mr-2" />
                  Run Diagnostics
                </Button>
                
                {isAuthenticated && (
                  <Button onClick={addTestBook} className="bg-[#F97316] hover:bg-[#F97316]/90">
                    <BookPlus className="h-4 w-4 mr-2" />
                    Add Test Book
                  </Button>
                )}
              </div>
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
                            console.log(`Image load error for story "${story.title}", using placeholder instead`);
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
                  {searchTerm ? (
                    'No stories match your search.'
                  ) : (
                    <div>
                      <p>No stories available in the database.</p>
                      <p className="mt-2">
                        {isAuthenticated ? (
                          <div>
                            <p>Try adding a story to get started.</p>
                            <div className="mt-4">
                              <Button 
                                onClick={addTestBook} 
                                className="bg-[#F97316] hover:bg-[#F97316]/90"
                              >
                                <BookPlus className="h-4 w-4 mr-2" />
                                Add Test Book
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>Stories may need to be added by an administrator.</>
                        )}
                      </p>
                      {!isAuthenticated && (
                        <p className="mt-2">
                          You may need to <Link to="/auth" className="text-[#F97316] hover:underline">sign in</Link> to view stories.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Debug Information:</h3>
                  <Button 
                    onClick={diagnoseDbIssues} 
                    className="bg-[#3A2618] hover:bg-[#3A2618]/80 text-sm"
                    size="sm"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Run Database Diagnostics
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <p><span className="font-semibold">Stories array length:</span> {stories.length}</p>
                  <p><span className="font-semibold">Filtered stories length:</span> {filteredStories.length}</p>
                  <p><span className="font-semibold">Search term:</span> "{searchTerm}"</p>
                  <p><span className="font-semibold">Auth state:</span> {isAuthenticated ? "Authenticated" : "Not authenticated"} | {isGuest ? "Guest mode" : "Full user"}</p>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Query Response:</h4>
                    <div className="max-h-32 overflow-auto bg-gray-200 p-2 rounded text-sm">
                      <pre>{JSON.stringify(queryResponse, null, 2) || "No query response recorded"}</pre>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Raw Database Response:</h4>
                    <div className="max-h-32 overflow-auto bg-gray-200 p-2 rounded text-sm">
                      <pre>{JSON.stringify(rawData, null, 2) || "No data received"}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
