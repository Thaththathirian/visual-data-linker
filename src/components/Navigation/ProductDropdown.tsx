import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { IntelliPartsItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductDropdownProps {
  products: IntelliPartsItem[];
  currentProductPath: string;
  onProductSelect: (product: IntelliPartsItem) => void;
  className?: string;
}

const ProductDropdown: React.FC<ProductDropdownProps> = ({
  products,
  currentProductPath,
  onProductSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<IntelliPartsItem[]>(products);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.sparepartspage_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProductClick = (product: IntelliPartsItem) => {
    onProductSelect(product);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  // Find current product index for navigation context
  const currentIndex = products.findIndex(p => p.sparepartspage_path === currentProductPath);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < products.length - 1;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="flex items-center space-x-1 p-0 h-auto text-gray-600 hover:text-gray-900"
      >
        <span>Products</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Product list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No products found
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const isCurrent = product.sparepartspage_path === currentProductPath;
                const isPrevious = index === currentIndex - 1;
                const isNext = index === currentIndex + 1;
                
                return (
                  <div
                    key={product.sparepartspage_path}
                    onClick={() => handleProductClick(product)}
                    className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      isCurrent ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-medium truncate ${
                            isCurrent ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {product.sparepartspage_name}
                          </h4>
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Current
                            </span>
                          )}
                          {isPrevious && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Previous
                            </span>
                          )}
                          {isNext && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Next
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Navigation info */}
          {currentIndex >= 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {hasPrevious && hasNext ? (
                <span>Product {currentIndex + 1} of {products.length}</span>
              ) : hasPrevious ? (
                <span>Last product of {products.length}</span>
              ) : hasNext ? (
                <span>First product of {products.length}</span>
              ) : (
                <span>Only product</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDropdown;
