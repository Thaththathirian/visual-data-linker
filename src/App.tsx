import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import ImageDetail from "@/pages/ImageDetail";
// import NotFound from "@/pages/NotFound"; // Commented out for future use

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<ImageDetail />} />
            <Route path="/image/:imageName" element={<ImageDetail />} />
            <Route path="/image/:imageName/:partNumber" element={<ImageDetail />} />
            {/* 404 page is commented out for now */}
            {/* <Route path="*" element={<NotFound />} /> */}
            <Route path="*" element={<ImageDetail />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
