import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Book, Edit, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

// Define the book type
interface BookType {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  cover_url?: string;
  isFree: boolean;
  category: string;
  lastUpdated: Date | string;
  story_url?: string;
  creator_id?: string;
  is_public_editable?: boolean;
}

const Dashboard = () => {
  const { user, isGuest } = useAuth();
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch books from Supabase
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase.from("books").select("*");

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Map Supabase data to our book format
          const mappedBooks = data.map((book) => ({
            id: book.id,
            title: book.title || "Untitled Book",
            subtitle: book.subtitle,
            description:
              book.description ||
              "A mystical tale about love, sacrifice, and the meaning of existence.",
            cover_url: book.cover_url,
            story_url: book.story_url,
            isFree: true,
            category: book.category || "Fantasy",
            lastUpdated: book.updated_at
              ? new Date(book.updated_at)
              : new Date(),
            creator_id: book.creator_id,
            is_public_editable: book.is_public_editable || false,
          }));
          setBooks(mappedBooks);
          console.log("Fetched books:", mappedBooks);
        } else {
          // Fallback to sample data if no books in database
          console.log("No books found, using fallback data");
          setBooks([
            {
              id: "fallback-id",
              title: "Shadowtide Island",
              subtitle: "The Ending",
              description:
                "A mystical tale about love, sacrifice, and the meaning of existence.",
              coverImage: "/shadowtidecover1.webp",
              isFree: true,
              category: "Fantasy",
              lastUpdated: new Date(),
              story_url:
                "https://pakmcaxaxyvhjdddfpdh.supabase.co/storage/v1/object/public/stories//ShadowtideEndTestJSON.json",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        // Fallback to sample data on error
        setBooks([
          {
            id: "fallback-id",
            title: "Shadowtide Island",
            subtitle: "The Ending",
            description:
              "A mystical tale about love, sacrifice, and the meaning of existence.",
            coverImage: "/shadowtidecover1.webp",
            isFree: true,
            category: "Fantasy",
            lastUpdated: new Date(),
            story_url:
              "https://pakmcaxaxyvhjdddfpdh.supabase.co/storage/v1/object/public/stories//ShadowtideEndTestJSON.json",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleBookClick = (book: BookType) => {
    setSelectedBook(book);
  };

  const handleReadBook = () => {
    if (selectedBook) {
      navigate(`/story/${selectedBook.id}`);
    }
  };

  const handleEditBook = () => {
    if (selectedBook) {
      navigate(`/story/edit/${selectedBook.id}`);
    }
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  // Function to check if user is the creator of the book
  const isCreator = (book: BookType) => {
    return user && book.creator_id === user.id;
  };

  // Function to check if user can edit the book (creator OR public editable)
  const canEdit = (book: BookType) => {
    return (user && book.creator_id === user.id) || book.is_public_editable === true;
  };

  // Function to get the appropriate category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Fantasy":
        return "text-[#8B5CF6] bg-[#8B5CF6]/10";
      case "Adventure":
        return "text-[#F97316] bg-[#F97316]/10";
      case "Horror":
        return "text-[#2E3A18] bg-[#2E3A18]/10";
      case "Sci-Fi":
        return "text-[#1A3A5A] bg-[#1A3A5A]/10";
      default:
        return "text-[#5A3A28] bg-[#5A3A28]/10";
    }
  };

  // Function to get the book cover image URL
  const getBookCoverUrl = (book: BookType) => {
    // First try to use the Supabase URL if available
    if (book.cover_url) {
      return book.cover_url;
    }
    // Then try to use the coverImage from our local data
    if (book.coverImage) {
      return book.coverImage;
    }
    // Fallback to default image in public folder
    return "/shadowtidecover1.webp";
  };

  // Function to format the date
  const formatDate = (date: Date | string) => {
    if (!date) return "Unknown";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Use our new Header component */}
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Book Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-[#3A2618] mb-6">
            {isGuest ? "Browse as Guest" : "Your Library"}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F97316] border-r-transparent"></div>
              <p className="mt-2 text-[#3A2618]">Loading books...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="h-48 bg-gray-200 relative">
                    {/* Book cover image */}
                    <img
                      src={getBookCoverUrl(book)}
                      alt={`${book.title} cover`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = "/shadowtidecover1.webp";
                      }}
                    />
                    
                    {/* Public editable badge */}
                    {book.is_public_editable && (
                      <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center text-xs font-medium">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Public
                      </div>
                    )}
                    
                    {/* Edit icon for users who can edit */}
                    {canEdit(book) && (
                      <div className="absolute top-2 right-2 bg-white bg-opacity-80 p-1 rounded-full">
                        <Edit className="h-4 w-4 text-[#F97316]" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif font-bold text-lg text-[#3A2618] mb-1">
                      {book.title}
                    </h3>
                    {book.subtitle && (
                      <p className="text-sm text-gray-600 mb-2">
                        {book.subtitle}
                      </p>
                    )}
                    <p
                      className={`text-sm px-2 py-1 rounded-full inline-block ${getCategoryColor(
                        book.category
                      )}`}
                    >
                      {book.category}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        Updated: {formatDate(book.lastUpdated)}
                      </span>
                      <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                        Free
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-[#E8DCC4] rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden relative">
            <button
              onClick={handleCloseDetails}
              className="absolute right-4 top-4 text-[#3A2618] hover:text-[#F97316] transition-colors"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 p-6 flex items-center justify-center bg-gray-200">
                {/* Book cover in the modal */}
                <img
                  src={getBookCoverUrl(selectedBook)}
                  alt={`${selectedBook.title} cover`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = "/shadowtidecover1.webp";
                  }}
                />
              </div>

              <div className="md:w-2/3 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-serif font-bold text-[#3A2618]">
                    {selectedBook.title}
                  </h2>
                  
                  {/* Public editable badge in modal */}
                  {selectedBook.is_public_editable && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center text-xs font-medium">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Public
                    </span>
                  )}
                </div>
                
                {selectedBook.subtitle && (
                  <p className="text-lg text-gray-700 mb-2">
                    {selectedBook.subtitle}
                  </p>
                )}
                <p
                  className={`text-sm px-2 py-1 rounded-full inline-block mb-4 ${getCategoryColor(
                    selectedBook.category
                  )}`}
                >
                  {selectedBook.category}
                </p>
                <p className="text-gray-700 mb-6">{selectedBook.description}</p>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">
                    Last updated: {formatDate(selectedBook.lastUpdated)}
                  </span>
                  <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded">
                    Free
                  </span>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleReadBook}
                    className="w-full bg-[#F97316] text-[#E8DCC4] py-3 rounded-md font-medium hover:bg-[#E86305] transition-colors duration-200"
                  >
                    Read Story
                  </button>
                  
                  {/* Edit button - shown to creators AND for public books */}
                  {canEdit(selectedBook) && (
                    <button
                      onClick={handleEditBook}
                      className="w-full bg-white text-[#F97316] border border-[#F97316] py-3 rounded-md font-medium hover:bg-[#F97316]/10 transition-colors duration-200 flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-2" /> 
                      {selectedBook.is_public_editable && !isCreator(selectedBook) 
                        ? "Edit Community Book" 
                        : "Edit Story"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
