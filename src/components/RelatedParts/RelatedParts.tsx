import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntelliPartsItem } from '@/types';
import { getMachineThumbnailPath, parseRelatedMachines, parseOtherPages, getMachineThumbnailFromDrive } from '@/utils/intelliPartsReader';

interface RelatedPartsProps {
  currentItem: IntelliPartsItem;
  allItems: IntelliPartsItem[];
  onPartClick: (item: IntelliPartsItem) => void;
}

interface RelatedPartCardProps {
  part: IntelliPartsItem;
  onPartClick: (item: IntelliPartsItem) => void;
  isMachine?: boolean;
}

const RelatedPartCard: React.FC<RelatedPartCardProps> = ({ part, onPartClick, isMachine = false }) => {
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        
        // First, try to get machine thumbnail from Google Drive
        const driveMachineImage = await getMachineThumbnailFromDrive(part.machine_name);
        if (driveMachineImage) {
          setImageUrl(driveMachineImage);
          setIsLoading(false);
          return;
        }
        
        // Fallback to local machine thumbnail
        if (isMachine) {
          // For machines, use machine thumbnail
          const machineThumbnailPath = getMachineThumbnailPath(part.machine_name);
          const response = await fetch(machineThumbnailPath);
          if (response.ok) {
            setImageUrl(machineThumbnailPath);
          } else {
            setImageUrl('/placeholder.svg');
          }
        } else {
          // For products, try machine thumbnail first, then fallback
          const machineThumbnailPath = getMachineThumbnailPath(part.machine_name);
          const response = await fetch(machineThumbnailPath);
          if (response.ok) {
            setImageUrl(machineThumbnailPath);
          } else {
            setImageUrl('/placeholder.svg');
          }
        }
      } catch (error) {
        console.error('Error loading related part thumbnail:', error);
        setImageUrl('/placeholder.svg');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [part.machine_name, isMachine]);

  return (
    <Card 
      key={`${part.brand}-${part.machine_name}-${part.sparepartspage_name}-${part.sparepartspage_path}`}
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 group"
      onClick={() => onPartClick(part)}
    >
      <CardContent className="p-3">
        {/* Thumbnail */}
        <div className="aspect-square mb-3 bg-white rounded-md border border-gray-200 flex items-center justify-center">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={isMachine ? part.machine_name : part.sparepartspage_name}
              className="max-w-full max-h-full object-contain"
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
            {isMachine ? part.machine_name : part.sparepartspage_name}
          </h3>
        </div>

        {/* All Badges in one line with consistent spacing */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className="text-xs min-w-fit">
            {part.brand}
          </Badge>
          <Badge variant="outline" className="text-xs min-w-fit">
            {part.machine_name}
          </Badge>
          <Badge variant="default" className="text-xs min-w-fit">
            {part.category}
          </Badge>
          <Badge variant="secondary" className="text-xs min-w-fit">
            {part.sub_category}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
          {isMachine ? `Machine: ${part.machine_name}` : `Product: ${part.sparepartspage_name}`}
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
  // Get related machines from related_machines column
  const getRelatedMachines = (): IntelliPartsItem[] => {
    const relatedMachineNames = parseRelatedMachines(currentItem.related_machines);
    if (relatedMachineNames.length === 0) return [];
    
    // Find all items that match the related machine names
    const relatedMachines = allItems.filter(item => 
      relatedMachineNames.includes(item.machine_name)
    );
    
    // Remove duplicates and current item
    const uniqueMachines = relatedMachines.filter((item, index, self) => 
      index === self.findIndex(t => t.machine_name === item.machine_name) &&
      item.machine_name !== currentItem.machine_name
    );
    
    return uniqueMachines;
  };

  // Get other pages from other_pages column
  const getOtherPages = (): IntelliPartsItem[] => {
    const otherPagePaths = parseOtherPages(currentItem.other_pages);
    if (otherPagePaths.length === 0) return [];
    
    // Find all items that match the other page paths
    const otherPages = allItems.filter(item => 
      otherPagePaths.includes(item.sparepartspage_path)
    );
    
    // Remove current item
    const filteredPages = otherPages.filter(item => 
      item.sparepartspage_path !== currentItem.sparepartspage_path
    );
    
    return filteredPages;
  };

  const relatedMachines = getRelatedMachines();
  const otherPages = getOtherPages();

  if (relatedMachines.length === 0 && otherPages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Related Machines Section */}
      {relatedMachines.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Related Machines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {relatedMachines.map((machine) => (
                <RelatedPartCard 
                  key={`machine-${machine.machine_name}-${machine.sparepartspage_path}`} 
                  part={machine} 
                  onPartClick={onPartClick}
                  isMachine={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Pages Section */}
      {otherPages.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Related Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {otherPages.map((part) => (
                <RelatedPartCard 
                  key={`part-${part.sparepartspage_path}`} 
                  part={part} 
                  onPartClick={onPartClick}
                  isMachine={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RelatedParts;
