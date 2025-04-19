import React, { useState } from 'react';
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

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search parts or images..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 border-0 focus:ring-0 text-lg px-4 py-2"
        />
      </div>
      {searchTerm && (
        <div className="absolute left-0 mt-2 w-full bg-white border rounded-md shadow-md z-10">
          {isSearching ? (
            <div className="px-4 py-2 text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((result, index) => (
                <li key={index} className="px-4 py-2 hover:bg-gray-100">
                  <a href={result.path} className="block">
                    {result.name} ({result.type})
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-gray-500">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
