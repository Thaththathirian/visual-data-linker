
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getAvailableFolders, checkFolderContents, loadImageData } from '@/utils/fileLoader';
import { ImageData } from '@/types';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FolderSearch } from "lucide-react";
import { Button } from '@/components/ui/button';

interface ImageListItem {
  name: string;
  folderName: string;
  fileName: string;
  pointCount: number;
}

const ImageList = () => {
  const [images, setImages] = useState<ImageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to trigger refreshes

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get available folders - now with more dynamic detection
        const folders = await getAvailableFolders();
        console.log('Found folders:', folders);
        
        if (folders.length === 0) {
          setError("No folders were detected in the data directory");
          setLoading(false);
          return;
        }
        
        const imageDetails: ImageListItem[] = [];
        
        for (const folder of folders) {
          try {
            // Check if folder has required files
            const { hasJson, hasImage, hasCsv, baseName } = await checkFolderContents(folder);
            
            if (hasJson && hasImage && baseName) {
              // Load the JSON data to get the image name and coordinates
              const imageData = await loadImageData(folder, baseName);
              
              if (imageData && imageData.coordinates && imageData.coordinates.length > 0) {
                imageDetails.push({
                  name: imageData.imageName.replace(/-/g, ' '),
                  folderName: folder,
                  fileName: baseName,
                  pointCount: imageData.coordinates.length
                });
                console.log(`Successfully added ${folder} to image list`);
              } else {
                console.log(`Folder ${folder} has valid JSON but the data format is incorrect`);
              }
            } else {
              console.log(`Folder ${folder} missing required files. JSON: ${hasJson}, Image: ${hasImage}, CSV: ${hasCsv}`);
            }
          } catch (folderErr) {
            console.error(`Error processing folder ${folder}:`, folderErr);
          }
        }
        
        setImages(imageDetails);
        
        if (imageDetails.length === 0) {
          setError("No valid diagram data could be loaded from the available folders");
        }
      } catch (err) {
        console.error('Error loading image list:', err);
        setError("Failed to load image list. Check console for details.");
      } finally {
        setLoading(false);
      }
    };
    
    loadImages();
  }, [refreshTrigger]); // Add refreshTrigger to dependency array to allow manual refreshes

  // Function to manually refresh the folder list
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1); // Increment to trigger a refresh
    toast.info("Refreshing folder list...");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-custom-blue"></div>
        <div className="ml-3">Loading available images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <FolderSearch className="h-4 w-4 mr-2" /> Refresh Folder List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Available Diagrams</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <FolderSearch className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No diagram data available.</p>
          <div className="text-sm text-gray-500 mt-2">
            Add folders to the src/data directory, with each folder containing:
            <ul className="list-disc ml-6 mt-1 text-left">
              <li>A JSON file with coordinate data</li>
              <li>A CSV file with part information</li>
              <li>An image file (.jpg, .png, etc.)</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((image) => (
            <Card key={image.folderName} className="hover:shadow-lg transition-shadow">
              <CardHeader className="font-semibold text-lg">
                {image.name}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Contains {image.pointCount} interactive points
                </p>
                <Link
                  to={`/${image.folderName}`}
                  className="inline-block bg-custom-blue text-white px-4 py-2 rounded hover:bg-custom-blue-light transition-colors"
                >
                  View Details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageList;
