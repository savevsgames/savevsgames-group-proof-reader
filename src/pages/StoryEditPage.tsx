
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

interface StoryEditPageProps {}

const StoryEditPage: React.FC<StoryEditPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError("Story not found");
          return;
        }

        // Check if user is the creator of the book
        if (data.creator_id && data.creator_id !== user.id) {
          setError("You do not have permission to edit this story");
          return;
        }

        setBook(data);
      } catch (error: any) {
        console.error("Error fetching book:", error);
        setError(error.message || "Failed to fetch book details");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F97316] border-r-transparent"></div>
            <p className="mt-2 text-[#3A2618]">Loading story editor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-serif font-bold text-[#3A2618] mb-4">
              Error
            </h2>
            <p className="text-[#3A2618]">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 bg-[#F97316] text-white px-4 py-2 rounded hover:bg-[#E86305] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-serif font-bold text-[#3A2618] mb-4">
            Editing: {book?.title}
          </h2>
          <div className="mb-6">
            {/* This is where the editor component will go in the next implementation */}
            <div className="p-4 border rounded-md bg-gray-50">
              <p>Story editor will be implemented here.</p>
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => navigate(`/story/${id}`)}
              className="bg-gray-200 text-[#3A2618] px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              className="bg-[#F97316] text-white px-4 py-2 rounded hover:bg-[#E86305] transition-colors"
              disabled
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryEditPage;
