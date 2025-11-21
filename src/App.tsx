import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PutzkraeftePage from "./pages/PutzkraeftePage";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Offline from "./pages/Offline";
import PWAUpdateNotification from "./components/PWAUpdateNotification";
import { usePWAAnalytics } from "./hooks/usePWAAnalytics";

const queryClient = new QueryClient();

const AppContent = () => {
  usePWAAnalytics();
  
  return (
    <>
      <Toaster />
      <Sonner />
      <PWAUpdateNotification />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/putzkraefte" element={<PutzkraeftePage />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/offline" element={<Offline />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
