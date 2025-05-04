
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getAvailableFolders, checkFolderContents, loadImageData } from '@/utils/fileLoader';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FolderSearch, ExternalLink } from "lucide-react";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use memoized function to prevent unnecessary re-renders
  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get available folders
      const folders = await getAvailableFolders();
      console.log('Found folders:', folders);
      
      if (folders.length === 0) {
        setError("No folders were detected. Please ensure your data files are in the correct location.");
        setLoading(false);
        return;
      }
      
      const imageDetails: ImageListItem[] = [];
      const folderPromises = folders.map(async (folder) => {
        try {
          // Check if folder has required files
          const { hasJson, hasImage, baseName } = await checkFolderContents(folder);
          
          if (hasJson && hasImage && baseName) {
            // Load the JSON data to get the image name and coordinates
            const imageData = await loadImageData(folder, baseName);
            
            if (imageData && imageData.coordinates && imageData.coordinates.length > 0) {
              return {
                name: imageData.imageName.replace(/-/g, ' '),
                folderName: folder,
                fileName: baseName,
                pointCount: imageData.coordinates.length
              };
            } 
          }
          return null;
        } catch (folderErr) {
          console.error(`Error processing folder ${folder}:`, folderErr);
          return null;
        }
      });
      
      // Wait for all folder processing to complete in parallel
      const results = await Promise.all(folderPromises);
      
      // Filter out null results and add to imageDetails
      results.filter(Boolean).forEach(item => {
        if (item) imageDetails.push(item);
      });
      
      setImages(imageDetails);
      
      if (imageDetails.length === 0) {
        setError("No valid diagram data could be loaded. Make sure your data files are in the public folder.");
      }
    } catch (err) {
      console.error('Error loading image list:', err);
      setError("Failed to load image list. Check console for details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages, refreshTrigger]); 

  // Function to manually refresh the folder list
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.info("Refreshing folder list...");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Available Diagrams</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <FolderSearch className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="font-medium mb-2">Deployment Tips</h3>
              <p className="text-sm mb-2">If you're seeing this error in production:</p>
              <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                <li>Make sure your data files (JSON, CSV, images) are in the <code className="bg-gray-100 px-1">public/data/</code> directory</li>
                <li>Each diagram should have its own folder (e.g., <code className="bg-gray-100 px-1">public/data/Brother_814_Needle_Bar_Mechanism/</code>)</li>
                <li>Each folder needs a JSON file and an image with matching names</li>
                <li>For image files, we support .png, .jpg, .jpeg, .webp, and .gif formats</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Structure Example</h4>
              <pre className="text-xs text-gray-600">
                public/data/your_folder_name/<br/>
                ├── diagram_name.json<br/>
                └── diagram_name.png
              </pre>
            </div>
            
            <Button onClick={handleRefresh} variant="outline" size="sm" className="self-start">
              <FolderSearch className="h-4 w-4 mr-2" /> Refresh Folder List
            </Button>
            
            <a 
              href="https://github.com/Thaththathirian/visual-data-linker/tree/main/src/data/test_Brother_814_Needle_Bar_Mechanism" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center self-start"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View example diagram files
            </a>
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
