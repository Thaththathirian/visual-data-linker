import React from 'react';
import { Badge } from '@/components/ui/badge';
import { IntelliPartsItem } from '@/types';

interface BrandFilterProps {
  items: IntelliPartsItem[];
  selectedBrand?: string; // legacy single select
  onBrandSelect?: (brand: string) => void; // legacy
  selectedBrands?: string[]; // multi-select controlled from parent
  onToggleBrand?: (brand: string) => void; // toggle for multi-select; 'all' clears
}

export const BrandFilter: React.FC<BrandFilterProps> = ({
  items,
  selectedBrand = '',
  onBrandSelect,
  selectedBrands,
  onToggleBrand
}) => {
  // Build deduped list and brand counts so numbers match product grid
  const { brands, brandCounts } = React.useMemo(() => {
    const deduped = items.filter((item, index, self) => {
      const itemKey = `${item.category}-${item.sub_category}-${item.machine_name}-${item.sparepartspage_name || 'unnamed'}-${item.sparepartspage_path || 'no-path'}`;
      return index === self.findIndex(t => {
        const tKey = `${t.category}-${t.sub_category}-${t.machine_name}-${t.sparepartspage_name || 'unnamed'}-${t.sparepartspage_path || 'no-path'}`;
        return tKey === itemKey;
      });
    });
    const map = new Map<string, number>();
    deduped.forEach(it => {
      const b = it.brand || '';
      if (!b) return;
      map.set(b, (map.get(b) || 0) + 1);
    });
    const brandList = Array.from(map.keys()).sort();
    return { brands: brandList, brandCounts: map };
  }, [items]);

  if (brands.length <= 1) {
    return null; // Don't show filter if there's only one brand or no brands
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Brand</h3>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedBrands && selectedBrands.length === 0 ? 'default' : selectedBrand === '' && !selectedBrands ? 'default' : 'outline'}
          className={`cursor-pointer transition-all duration-200 ${
            selectedBrands && selectedBrands.length > 0 ? 'opacity-60' : ''
          }`}
          onClick={() => onToggleBrand ? onToggleBrand('all') : onBrandSelect && onBrandSelect('')}
        >
          All Brands
        </Badge>
        {brands.map((brand) => {
          const isSelectedMulti = Array.isArray(selectedBrands) && selectedBrands.includes(brand);
          const dim = isSelectedMulti; // dim when selected in input
          return (
          <Badge
            key={brand}
            variant={selectedBrand === brand && !selectedBrands ? 'default' : 'outline'}
            className={`cursor-pointer transition-all duration-200 ${dim ? 'opacity-60' : ''}`}
            onClick={() => onToggleBrand ? onToggleBrand(brand) : onBrandSelect && onBrandSelect(brand)}
          >
            {brand} ({brandCounts.get(brand) || 0})
          </Badge>
          );
        })}
      </div>
    </div>
  );
};
