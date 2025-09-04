import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndexItem } from '@/utils/indexReader';

interface ProductGridProps {
  items: IndexItem[];
  onItemClick: (item: IndexItem) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ items, onItemClick }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No items found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <Card
          key={item.id || item.coordinates_path || item.data_path || `${item.category}-${item.subcategory}-${item.file_name}`}
          className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 group"
          onClick={() => onItemClick(item)}
        >
          <CardContent className="p-3">
            {/* Thumbnail */}
            <div className="aspect-square mb-3 bg-gray-100 rounded-md overflow-hidden">
              <img
                src={item.thumbnail_path}
                alt={item.file_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            </div>

            {/* Title */}
            <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2 leading-tight">
              {item.file_name}
            </h3>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-tight">
              {item.description}
            </p>


          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;

