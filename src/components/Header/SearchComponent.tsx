
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SearchResult } from '@/types';

const mockResults: SearchResult[] = [
  {
    type: "image",
    name: "Page 1 Circle",
    path: "/image/page-1-circle"
  },
  {
    type: "part",
    name: "Bracket",
    path: "/image/page-1-circle/1"
  }
];

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);

    // Simulate API call
    setTimeout(() => {
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  // Prevent navigation
  const handlePrevent = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="flex items-center border rounded-lg px-2 py-1 bg-white" style={{ minHeight: "34px" }}>
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search parts or images..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 border-0 focus:ring-0 text-sm px-2 py-1 h-9 w-64 md:w-[340px] transition-all duration-200"
          style={{ minWidth: "180px", width: "340px", maxWidth: "450px" }}
        />
      </div>
      {searchTerm && (
        <div className="absolute left-0 mt-1 w-full bg-white border rounded-md shadow-md z-10">
          {isSearching ? (
            <div className="px-3 py-1 text-gray-500 text-sm">Searching...</div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((result, index) => (
                <li key={index} className="px-3 py-1 hover:bg-gray-100 text-sm">
                  <Link 
                    to="/" 
                    className="block" 
                    onClick={handlePrevent}
                  >
                    {result.name} ({result.type})
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-1 text-gray-500 text-sm">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
