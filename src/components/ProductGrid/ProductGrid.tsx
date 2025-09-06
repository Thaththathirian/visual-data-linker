import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntelliPartsItem } from '@/types';
import { getMachineThumbnailPath, getProductImagePath, getMachineThumbnailFromDrive } from '@/utils/intelliPartsReader';

interface ProductGridProps {
  items: IntelliPartsItem[];
  onItemClick: (item: IntelliPartsItem) => void;
}

interface ProductCardProps {
  item: IntelliPartsItem;
  onItemClick: (item: IntelliPartsItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onItemClick }) => {
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        
        // First, try to get machine thumbnail from Google Drive
        const driveMachineImage = await getMachineThumbnailFromDrive(item.machine_name);
        if (driveMachineImage) {
          setImageUrl(driveMachineImage);
          setIsLoading(false);
          return;
        }
        
        // Fallback to local machine thumbnail
        const machineThumbnailPath = getMachineThumbnailPath(item.machine_name);
        const productImagePath = getProductImagePath(item.sparepartspage_path);
        
        // Try machine thumbnail first
        const response = await fetch(machineThumbnailPath);
        if (response.ok) {
          setImageUrl(machineThumbnailPath);
        } else {
          // Fallback to product image
          const productResponse = await fetch(productImagePath);
          if (productResponse.ok) {
            setImageUrl(productImagePath);
          } else {
            setImageUrl('/placeholder.svg');
          }
        }
      } catch (error) {
        console.error('Error loading product thumbnail:', error);
        setImageUrl('/placeholder.svg');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [item.machine_name, item.sparepartspage_path]);

  return (
    <Card
      key={`${item.brand}-${item.machine_name}-${item.sparepartspage_name}`}
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
              alt={item.sparepartspage_name || 'Product'}
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
            {item.sparepartspage_name}
          </h3>
        </div>

        {/* All Badges in one line with consistent spacing */}
        {(item.brand || item.machine_name || item.category || item.sub_category) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {item.brand && (
              <Badge className="text-xs min-w-fit bg-blue-100 text-blue-800 hover:bg-blue-200">
                {item.brand}
              </Badge>
            )}
            {item.machine_name && (
              <Badge className="text-xs min-w-fit bg-green-100 text-green-800 hover:bg-green-200">
                {item.machine_name}
              </Badge>
            )}
            {item.category && (
              <Badge className="text-xs min-w-fit bg-purple-100 text-purple-800 hover:bg-purple-200">
                {item.category}
              </Badge>
            )}
            {item.sub_category && (
              <Badge className="text-xs min-w-fit bg-orange-100 text-orange-800 hover:bg-orange-200">
                {item.sub_category}
              </Badge>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({ items, onItemClick }) => {
  if (items.length === 0) {
    return null; // Don't render anything when no items
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ProductCard key={`${item.brand}-${item.machine_name}-${item.sparepartspage_name}`} item={item} onItemClick={onItemClick} />
      ))}
    </div>
  );
};

export default ProductGrid;

