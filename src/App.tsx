import React, { useState } from "react";
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
import PortalChat from "./components/PortalChat";
import AutoLogin from "./components/AutoLogin";
import { usePWAAnalytics } from "./hooks/usePWAAnalytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppContent = () => {
  usePWAAnalytics();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    <>
      <AutoLogin />
      <Toaster />
      <Sonner />
      <PWAUpdateNotification />
      <PortalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <Routes>
        <Route path="/" element={<Index chatProps={{ isChatOpen, setIsChatOpen }} />} />
        <Route path="/putzkraefte" element={<PutzkraeftePage chatProps={{ isChatOpen, setIsChatOpen }} />} />
        <Route path="/calendar" element={<Calendar chatProps={{ isChatOpen, setIsChatOpen }} />} />
        <Route path="/offline" element={<Offline />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
