import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, Store } from "lucide-react";
import { motion } from "framer-motion";
import SearchComponent from "./SearchComponent";

const Header: React.FC = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  return (
    <header className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-10 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
            <img
              src="/swastik.svg"
              alt="Swastik Brand"
              className="h-8 w-auto ml-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </Link>
        </div>

        {/* Search Box - Only on larger screens or when active */}
        <div className={`relative ${isSearchActive ? 'fixed top-4 left-0 right-0 z-50 bg-white p-4 md:static md:p-0 md:z-auto' : 'hidden md:block'}`}>
          <SearchComponent onClose={() => setIsSearchActive(false)} />
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
            <Link to="/store">
              <Store className="h-6 w-6 text-gray-700" />
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link to="/user">
              <User className="h-6 w-6 text-gray-700" />
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
