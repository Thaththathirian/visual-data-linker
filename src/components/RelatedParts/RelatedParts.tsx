import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndexItem } from '@/utils/indexReader';
import { getProductThumbnail } from '@/utils/fileLoader';

interface RelatedPartsProps {
  currentItem: IndexItem;
  allItems: IndexItem[];
  onPartClick: (item: IndexItem) => void;
}

interface RelatedPartCardProps {
  part: IndexItem;
  onPartClick: (item: IndexItem) => void;
}

const RelatedPartCard: React.FC<RelatedPartCardProps> = ({ part, onPartClick }) => {
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (part.product_path) {
        try {
          setIsLoading(true);
          const thumbnailUrl = await getProductThumbnail(part.product_path);
          if (thumbnailUrl) {
            setImageUrl(thumbnailUrl);
          } else {
            setImageUrl('/placeholder.svg');
          }
        } catch (error) {
          console.error('Error loading related part thumbnail:', error);
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
  }, [part.product_path]);

  return (
    <Card 
      key={part.id} 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 group"
      onClick={() => onPartClick(part)}
    >
      <CardContent className="p-3">
        {/* Thumbnail */}
        <div className="aspect-square mb-3 bg-gray-100 rounded-md overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={part.product_name || part.file_name || 'Product'}
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
            {part.product_name || part.file_name}
          </h3>
        </div>

        {/* All Badges in one line with consistent spacing */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className="text-xs min-w-fit">
            {part.brand}
          </Badge>
          <Badge variant="outline" className="text-xs min-w-fit">
            {part.model}
          </Badge>
          <Badge variant="default" className="text-xs min-w-fit">
            {part.category}
          </Badge>
          <Badge variant="secondary" className="text-xs min-w-fit">
            {part.type || part.subcategory}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
          {part.product_description || part.description}
        </p>
      </CardContent>
    </Card>
  );
};

export const RelatedParts: React.FC<RelatedPartsProps> = ({
  currentItem,
  allItems,
  onPartClick
}) => {
  // Get all related products specified in relative_products column (bracket notation)
  const getRelatedParts = (): IndexItem[] => {
    if (!currentItem.relative_products) {
      return [];
    }
    
    // Parse bracket notation: [Product1, Product2, Product3]
    let relatedProductNames: string[] = [];
    if (currentItem.relative_products.startsWith('[') && currentItem.relative_products.endsWith(']')) {
      const content = currentItem.relative_products.slice(1, -1); // Remove brackets
      relatedProductNames = content
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    } else {
      // Fallback for non-bracket format
      relatedProductNames = currentItem.relative_products
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    }
    
    // Find all items that match the related product names (by product_path)
    const relatedItems = allItems.filter(item => 
      relatedProductNames.includes(item.product_path)
    );
    
    return relatedItems;
  };

  const relatedParts = getRelatedParts();

  if (relatedParts.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Related Parts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {relatedParts.map((part) => (
            <RelatedPartCard key={part.id} part={part} onPartClick={onPartClick} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RelatedParts;
