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
          className="cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => onBrandSelect('')}
        >
          All Brands
        </Badge>
        {brands.map((brand) => (
          <Badge
            key={brand}
            variant={selectedBrand === brand ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => onBrandSelect(brand)}
          >
            {brand}
          </Badge>
        ))}
      </div>
    </div>
  );
};
