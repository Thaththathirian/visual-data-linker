
import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SearchResult } from "@/types";

interface SearchComponentProps {
  onClose?: () => void;
}

export const SearchComponent: React.FC<SearchComponentProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock search function - in a real app, this would query your data
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    // Mock search results
    const mockResults: SearchResult[] = [
      { type: "image", name: "Page 1 Circle", path: "/image/page-1-circle" },
      { type: "image", name: "Sewing Machine X200", path: "/image/sewing-machine-x200" },
      { type: "part", name: "Needle Bar", path: "/image/page-1-circle/2" },
      { type: "part", name: "Thread Tension", path: "/image/sewing-machine-x200/1" },
    ].filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setResults(mockResults);
  }, [searchTerm]);

  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
          <Search className="h-5 w-5 ml-3 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search images, parts, or components..."
            className="w-full p-2 pl-2 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-2">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 md:hidden">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            <ul className="py-1">
              {results.map((result, index) => (
                <li key={index}>
                  <Link
                    to={result.path}
                    className="block px-4 py-2 hover:bg-gray-100 flex items-center"
                    onClick={onClose}
                  >
                    {result.type === "image" ? (
                      <Search className="h-4 w-4 mr-2 text-custom-blue" />
                    ) : (
                      <div className="h-4 w-4 mr-2 rounded-full bg-custom-blue flex items-center justify-center text-white text-xs">
                        {result.path.split("/").pop()}
                      </div>
                    )}
                    <span>{result.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {result.type === "image" ? "Image" : "Part"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};
