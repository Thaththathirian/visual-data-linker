
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getAvailableImageFiles, loadImageData } from '@/utils/fileLoader';
import { ImageData } from '@/types';

interface ImageListItem {
  name: string;
  path: string;
  pointCount: number;
}

const ImageList = () => {
  const [images, setImages] = useState<ImageListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        const imageFiles = await getAvailableImageFiles();
        
        const imageDetails: ImageListItem[] = [];
        
        for (const file of imageFiles) {
          const imageData = await loadImageData(file);
          if (imageData) {
            imageDetails.push({
              name: imageData.imageName.replace(/-/g, ' '),
              path: file,
              pointCount: imageData.coordinates.length
            });
          }
        }
        
        setImages(imageDetails);
      } catch (err) {
        console.error('Error loading image list:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadImages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-custom-blue"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No images available.</p>
        <p className="text-sm text-gray-500 mt-2">
          Add images to the public/images directory, along with corresponding JSON files in src/data/images 
          and XLSX files in src/data/tables.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {images.map((image) => (
        <Card key={image.path} className="hover:shadow-lg transition-shadow">
          <CardHeader className="font-semibold text-lg">
            {image.name}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Contains {image.pointCount} interactive points
            </p>
            <Link
              to={`/image/${image.path}`}
              className="inline-block bg-custom-blue text-white px-4 py-2 rounded hover:bg-custom-blue-light transition-colors"
            >
              View Details
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ImageList;
