
import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import StoryPage from "./pages/StoryPage";
import StoryEditPage from "./pages/StoryEditPage";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/toaster";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/story/:id" element={<StoryPage />} />
        <Route path="/story/edit/:id" element={<StoryEditPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
