import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndexItem } from '@/utils/indexReader';
import { getProductThumbnail } from '@/utils/fileLoader';

interface ProductGridProps {
  items: IndexItem[];
  onItemClick: (item: IndexItem) => void;
}

interface ProductCardProps {
  item: IndexItem;
  onItemClick: (item: IndexItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onItemClick }) => {
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (item.product_path) {
        try {
          setIsLoading(true);
          const thumbnailUrl = await getProductThumbnail(item.product_path);
          if (thumbnailUrl) {
            setImageUrl(thumbnailUrl);
          } else {
            setImageUrl('/placeholder.svg');
          }
        } catch (error) {
          console.error('Error loading product thumbnail:', error);
          setImageUrl('/placeholder.svg');
        } finally {
          setIsLoading(false);
        }
      } else {
        setImageUrl('/placeholder.svg');
        setIsLoading(false);
      }
    };

    loadImage();
  }, [item.product_path]);

  return (
    <Card
      key={item.id || item.product_path || `${item.brand}-${item.model}-${item.product_name}`}
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 group"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="p-3">
        {/* Thumbnail */}
        <div className="aspect-square mb-3 bg-gray-100 rounded-md overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={item.product_name || item.file_name || 'Product'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          )}
        </div>

        {/* Title with fixed height */}
        <div className="h-10 mb-2 flex items-start">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
            {item.product_name || item.file_name}
          </h3>
        </div>

        {/* All Badges in one line with consistent spacing */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className="text-xs min-w-fit">
            {item.brand}
          </Badge>
          <Badge variant="outline" className="text-xs min-w-fit">
            {item.model}
          </Badge>
          <Badge variant="default" className="text-xs min-w-fit">
            {item.category}
          </Badge>
          <Badge variant="secondary" className="text-xs min-w-fit">
            {item.type || item.subcategory}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
          {item.product_description || item.description}
        </p>
      </CardContent>
    </Card>
  );
};

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
        <ProductCard key={item.id || item.product_path || `${item.brand}-${item.model}-${item.product_name}`} item={item} onItemClick={onItemClick} />
      ))}
    </div>
  );
};

export default ProductGrid;

