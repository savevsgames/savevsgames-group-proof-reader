
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Book, LogOut, User } from 'lucide-react';

// This is sample data - in a real app, you'd fetch this from Supabase
const sampleBooks = [
  {
    id: 'dog-story',
    title: 'The Lost Dog',
    description: 'A heartwarming story about choices and compassion.',
    coverImage: '/dog-story-cover.jpg', // You'll need to add this image
    isFree: true,
    category: 'Adventure',
    lastUpdated: '2023-05-15',
  },
  {
    id: 'dark-eye-story',
    title: 'The Dark Eye',
    description: 'A mystical tale about love, sacrifice, and the battle against an ancient entity.',
    coverImage: '/dark-eye-cover.jpg', // You'll need to add this image
    isFree: true,
    category: 'Fantasy',
    lastUpdated: '2023-09-22',
  }
];

const Dashboard = () => {
  const { user, isGuest, signOut } = useAuth();
  const [selectedBook, setSelectedBook] = useState<typeof sampleBooks[0] | null>(null);
  const navigate = useNavigate();

  const handleBookClick = (book: typeof sampleBooks[0]) => {
    setSelectedBook(book);
  };

  const handleReadBook = () => {
    if (selectedBook) {
      navigate(`/story/${selectedBook.id}`);
    }
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <header className="bg-[#3A2618] text-[#E8DCC4] py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Book className="h-8 w-8" />
            <h1 className="text-2xl font-serif font-bold">StoryTale Library</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              {isGuest ? (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Guest User
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user?.username || user?.email || 'User'}
                </span>
              )}
            </div>
            <button 
              onClick={() => signOut().then(() => navigate('/'))}
              className="flex items-center text-sm hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Book Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-[#3A2618] mb-6">
            {isGuest ? 'Browse as Guest' : 'Your Library'}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sampleBooks.map((book) => (
              <div 
                key={book.id} 
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <div className="h-48 bg-gray-200">
                  {/* Book cover backgrounds based on category */}
                  <div className={`h-full w-full flex items-center justify-center ${
                    book.category === 'Fantasy' ? 'bg-[#4C3B71]' : 
                    book.category === 'Adventure' ? 'bg-[#8B2E2E]' :
                    book.category === 'Horror' ? 'bg-[#2E3A18]' :
                    book.category === 'Sci-Fi' ? 'bg-[#1A3A5A]' :
                    'bg-[#5A3A28]'
                  }`}>
                    <Book className="h-16 w-16 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-bold text-lg text-[#3A2618] mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{book.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Updated: {book.lastUpdated}</span>
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                      Free
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-[#E8DCC4] rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden relative">
            <button 
              onClick={handleCloseDetails}
              className="absolute right-4 top-4 text-[#3A2618] hover:text-[#8B2E2E] transition-colors"
            >
              ✕
            </button>
            
            <div className="flex flex-col md:flex-row">
              <div className={`md:w-1/3 p-6 flex items-center justify-center ${
                selectedBook.category === 'Fantasy' ? 'bg-[#4C3B71]' : 
                selectedBook.category === 'Adventure' ? 'bg-[#8B2E2E]' :
                selectedBook.category === 'Horror' ? 'bg-[#2E3A18]' :
                selectedBook.category === 'Sci-Fi' ? 'bg-[#1A3A5A]' :
                'bg-[#5A3A28]'
              }`}>
                <Book className="h-24 w-24 text-white" />
              </div>
              
              <div className="md:w-2/3 p-6">
                <h2 className="text-2xl font-serif font-bold text-[#3A2618] mb-2">
                  {selectedBook.title}
                </h2>
                <p className="text-sm font-medium text-[#8B2E2E] mb-4">{selectedBook.category}</p>
                <p className="text-gray-700 mb-6">{selectedBook.description}</p>
                
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">Last updated: {selectedBook.lastUpdated}</span>
                  <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded">
                    Free
                  </span>
                </div>
                
                <button
                  onClick={handleReadBook}
                  className="w-full bg-[#8B2E2E] text-[#E8DCC4] py-3 rounded-md font-medium hover:bg-[#6A2424] transition-colors duration-200"
                >
                  Read Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
