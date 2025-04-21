
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, Store } from "lucide-react";
import { motion } from "framer-motion";
import SearchComponent from "./SearchComponent";

const Header: React.FC = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Prevent navigation for all click handlers for logo/user/store/home/nav
  const handlePrevent = (e: React.MouseEvent<HTMLAnchorElement | HTMLImageElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <header className="bg-white shadow-sm p-2 min-h-0"> {/* Reduced padding for height */}
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <a href="/" onClick={handlePrevent} className="flex items-center">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-7 w-auto"
              onClick={handlePrevent}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
            <img
              src="/swastik.svg"
              alt="Swastik Brand"
              className="h-6 w-auto ml-2"
              onClick={handlePrevent}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </a>
        </div>

        {/* Search Box - Only on larger screens or when active */}
        <div className={`relative ${isSearchActive ? 'fixed top-4 left-0 right-0 z-50 bg-white p-4 md:static md:p-0 md:z-auto' : 'hidden md:block'}`}>
          <SearchComponent />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden"
            onClick={() => setIsSearchActive(true)}
          >
            <Search className="h-6 w-6 text-gray-700" />
          </motion.button>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <a href="/store" onClick={handlePrevent}>
              <Store className="h-6 w-6 text-gray-700" />
            </a>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <a href="/user" onClick={handlePrevent}>
              <User className="h-6 w-6 text-gray-700" />
            </a>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
