
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import ImageDetail from "@/pages/ImageDetail";

const queryClient = new QueryClient();

const App = () => (
  // BrowserRouter must wrap everything that uses router hooks
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Layout>
          <Routes>
            <Route path="/" element={<ImageDetail />} />
            <Route path="/image/:imageName" element={<ImageDetail />} />
            <Route path="/image/:imageName/:partNumber" element={<ImageDetail />} />
            <Route path="/api/:imageName/:partNumber" element={<ImageDetail />} />
            <Route path="*" element={<ImageDetail />} />
          </Routes>
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
