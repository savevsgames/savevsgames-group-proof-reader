
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import StoryPage from "@/pages/StoryPage";
import NotFound from "@/pages/NotFound";
import FAQ from "@/pages/FAQ";
import Auth from "@/pages/Auth";
import EmailConfirmation from "@/components/EmailConfirmation";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/story/:storyId" element={<StoryPage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<EmailConfirmation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
