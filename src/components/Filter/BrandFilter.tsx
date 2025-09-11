import React from 'react';
import { Badge } from '@/components/ui/badge';
import { IntelliPartsItem } from '@/types';

interface BrandFilterProps {
  items: IntelliPartsItem[];
  selectedBrand: string;
  onBrandSelect: (brand: string) => void;
}

export const BrandFilter: React.FC<BrandFilterProps> = ({
  items,
  selectedBrand,
  onBrandSelect
}) => {
  // Get unique brands from items
  const brands = React.useMemo(() => {
    const uniqueBrands = Array.from(new Set(items.map(item => item.brand).filter(Boolean)));
    return uniqueBrands.sort();
  }, [items]);

  if (brands.length <= 1) {
    return null; // Don't show filter if there's only one brand or no brands
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Brand</h3>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedBrand === '' ? 'default' : 'outline'}
          className={`cursor-pointer transition-all duration-200 ${
            selectedBrand === '' 
              ? 'hover:bg-blue-600 hover:text-white hover:shadow-md' 
              : 'hover:bg-gray-100 hover:text-gray-900'
          }`}
          onClick={() => onBrandSelect('')}
        >
          All Brands
        </Badge>
        {brands.map((brand) => (
          <Badge
            key={brand}
            variant={selectedBrand === brand ? 'default' : 'outline'}
            className={`cursor-pointer transition-all duration-200 ${
              selectedBrand === brand 
                ? 'hover:bg-blue-600 hover:text-white hover:shadow-md' 
                : 'hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => onBrandSelect(brand)}
          >
            {brand}
          </Badge>
        ))}
      </div>
    </div>
  );
};
