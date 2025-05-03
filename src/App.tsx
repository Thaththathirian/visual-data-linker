
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import ImageDetail from "@/pages/ImageDetail";
import Home from "@/pages/Home";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:folderName" element={<ImageDetail />} />
            <Route path="/:folderName/:partNumber" element={<ImageDetail />} />
            <Route path="/api/:folderName/:partNumber" element={<ImageDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
