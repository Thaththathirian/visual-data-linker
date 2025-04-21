
import React from "react";
import Header from "@/components/Header/Header";
import Navigation from "@/components/Navigation/Navigation";
import Footer from "@/components/Footer/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navigation />
      <main className="flex-grow container mx-auto px-4">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
