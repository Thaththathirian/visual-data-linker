import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
// This filter supports both IndexItem (legacy) and IntelliPartsItem (current)
// so we intentionally keep item typing broad and normalize field access.
interface ProductFilterProps {
  items: any[];
  onFilterChange: (filteredItems: any[]) => void;
}

interface FilterState {
  brand: string;
  model: string;
  category: string;
  type: string;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ items, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    brand: 'all',
    model: 'all',
    category: 'all',
    type: 'all'
  });

  // Helper to safely read string fields across item shapes
  const getValue = (item: any, keys: string[]): string => {
    for (const key of keys) {
      const v = item?.[key];
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    return '';
  };

  // Get unique values for each filter across both schemas
  const uniqueBrands = Array.from(new Set(items.map(item => getValue(item, ['brand'])).filter(Boolean))).sort();
  const uniqueModels = Array.from(new Set(items.map(item => getValue(item, ['model', 'machine_name'])).filter(Boolean))).sort();
  const uniqueCategories = Array.from(new Set(items.map(item => getValue(item, ['category'])).filter(Boolean))).sort();
  const uniqueTypes = Array.from(new Set(items.map(item => getValue(item, ['type', 'subcategory', 'sub_category'])).filter(Boolean))).sort();

  // Filter items based on current filter state
  const filteredItems = items.filter(item => {
    if (filters.brand && filters.brand !== 'all' && getValue(item, ['brand']) !== filters.brand) return false;
    if (filters.model && filters.model !== 'all' && getValue(item, ['model', 'machine_name']) !== filters.model) return false;
    if (filters.category && filters.category !== 'all' && getValue(item, ['category']) !== filters.category) return false;
    if (filters.type && filters.type !== 'all' && getValue(item, ['type', 'subcategory', 'sub_category']) !== filters.type) return false;
    return true;
  });

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filteredItems);
  }, [filteredItems, onFilterChange]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilter = (key: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [key]: 'all'
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      brand: 'all',
      model: 'all',
      category: 'all',
      type: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all');

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-1">
        {/* <h3 className="text-lg font-semibold text-gray-900">Filters</h3> */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brand Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Brand</label>
          <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.brand && filters.brand !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              {filters.brand}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('brand')}
              />
            </Badge>
          )}
        </div>

        {/* Model Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Model</label>
          <Select value={filters.model} onValueChange={(value) => handleFilterChange('model', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {uniqueModels.map(model => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.model && filters.model !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              {filters.model}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('model')}
              />
            </Badge>
          )}
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.category && filters.category !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('category')}
              />
            </Badge>
          )}
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Type</label>
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.type && filters.type !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              {filters.type}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('type')}
              />
            </Badge>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Showing {filteredItems.length} of {items.length} products</p>
        </div>
      )}
    </div>
  );
};

export default ProductFilter;
