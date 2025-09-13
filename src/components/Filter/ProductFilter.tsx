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
  category: string;
  type: string;
  brand: string;
  machine: string;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ items, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    type: 'all',
    brand: 'all',
    machine: 'all'
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
  const uniqueCategories = Array.from(new Set(items.map(item => getValue(item, ['category'])).filter(Boolean))).sort();
  const uniqueTypes = Array.from(new Set(items.map(item => getValue(item, ['type', 'subcategory', 'sub_category'])).filter(Boolean))).sort();
  const uniqueBrands = Array.from(new Set(items.map(item => getValue(item, ['brand'])).filter(Boolean))).sort();
  const uniqueMachines = Array.from(new Set(items.map(item => getValue(item, ['model', 'machine_name'])).filter(Boolean))).sort();

  // Check if items are already pre-filtered by category/subcategory
  // If all items have the same category, don't show category filter
  const hasMultipleCategories = uniqueCategories.length > 1;
  const hasMultipleTypes = uniqueTypes.length > 1;

  // Filter items based on current filter state
  // Skip category/subcategory filtering if items are already pre-filtered (to avoid overriding strict category selection)
  const filteredItems = items.filter(item => {
    // Only apply category filter if we have multiple categories in the items (indicating not pre-filtered)
    if (hasMultipleCategories && filters.category && filters.category !== 'all' && getValue(item, ['category']) !== filters.category) return false;
    // Only apply type/subcategory filter if we have multiple types in the items (indicating not pre-filtered)
    if (hasMultipleTypes && filters.type && filters.type !== 'all' && getValue(item, ['type', 'subcategory', 'sub_category']) !== filters.type) return false;
    if (filters.brand && filters.brand !== 'all' && getValue(item, ['brand']) !== filters.brand) return false;
    if (filters.machine && filters.machine !== 'all' && getValue(item, ['model', 'machine_name']) !== filters.machine) return false;
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
      category: 'all',
      type: 'all',
      brand: 'all',
      machine: 'all'
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
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className={`grid gap-4 ${hasMultipleCategories && hasMultipleTypes ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : hasMultipleCategories || hasMultipleTypes ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Category Filter - only show if there are multiple categories */}
        {hasMultipleCategories && (
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
              <Badge variant="secondary" className="flex items-center gap-1 w-fit hover:bg-blue-100 hover:text-blue-800 hover:shadow-sm transition-all duration-200">
                {filters.category}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-blue-600" 
                  onClick={() => clearFilter('category')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Type Filter - only show if there are multiple types/subcategories */}
        {hasMultipleTypes && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Model</label>
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.type && filters.type !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1 w-fit hover:bg-blue-100 hover:text-blue-800 hover:shadow-sm transition-all duration-200">
                {filters.type}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-blue-600" 
                  onClick={() => clearFilter('type')}
                />
              </Badge>
            )}
          </div>
        )}

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
            <Badge variant="secondary" className="flex items-center gap-1 w-fit hover:bg-blue-100 hover:text-blue-800 hover:shadow-sm transition-all duration-200">
              {filters.brand}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-blue-600" 
                onClick={() => clearFilter('brand')}
              />
            </Badge>
          )}
        </div>

        {/* Machine Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Machine</label>
          <Select value={filters.machine} onValueChange={(value) => handleFilterChange('machine', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Machines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Machines</SelectItem>
              {uniqueMachines.map(machine => (
                <SelectItem key={machine} value={machine}>
                  {machine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.machine && filters.machine !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit hover:bg-blue-100 hover:text-blue-800 hover:shadow-sm transition-all duration-200">
              {filters.machine}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-blue-600" 
                onClick={() => clearFilter('machine')}
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
