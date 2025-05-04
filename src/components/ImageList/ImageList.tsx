
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getAvailableFolders, checkFolderContents, loadImageData } from '@/utils/fileLoader';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FolderSearch, ExternalLink, FileText, FileJson, Image } from "lucide-react";
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
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Use memoized function to prevent unnecessary re-renders
  const loadImages = useCallback(async () => {
    try {
      if (loading && !loadingComplete) {
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
        
        // Process each folder one at a time to avoid parallel requests issues
        for (const folder of folders) {
          try {
            // Check if folder has required files
            const { hasJson, baseName } = await checkFolderContents(folder);
            
            if (hasJson && baseName) {
              try {
                // Load the JSON data to get the image name and coordinates
                const imageData = await loadImageData(folder, baseName);
                
                if (imageData) {
                  imageDetails.push({
                    name: imageData.imageName.replace(/-/g, ' '),
                    folderName: folder,
                    fileName: baseName,
                    pointCount: imageData.coordinates?.length || 0
                  });
                }
              } catch (jsonErr) {
                console.error(`Error parsing JSON for ${folder}/${baseName}:`, jsonErr);
              }
            }
          } catch (folderErr) {
            console.error(`Error processing folder ${folder}:`, folderErr);
          }
        }
        
        setImages(imageDetails);
        
        if (imageDetails.length === 0) {
          setError("No valid diagram data could be loaded. Make sure your data files are in the public folder.");
        }
        
        setLoadingComplete(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading image list:', err);
      setError("Failed to load image list. Check console for details.");
      setLoading(false);
    }
  }, [loading, loadingComplete]);

  useEffect(() => {
    loadImages();
  }, [loadImages]); 

  // Function to reload the folder list
  const handleScan = () => {
    // Clear browser cache for data files
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
    
    setLoadingComplete(false);
    setLoading(true);
    toast.info("Scanning for diagram folders...");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Available Diagrams</h2>
        <Button onClick={handleScan} variant="outline" size="sm">
          <FolderSearch className="h-4 w-4 mr-2" /> Scan Folders
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
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
              <h3 className="font-medium mb-2">Data Folder Setup</h3>
              <p className="text-sm mb-2">To add diagrams to this application:</p>
              <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                <li>Create a folder in <code className="bg-gray-100 px-1">public/data/</code> with your diagram name (e.g., <code className="bg-gray-100 px-1">public/data/Your_Diagram_Name/</code>)</li>
                <li>Add these files with matching names inside the folder:
                  <ul className="list-circle pl-5 mt-1 space-y-1">
                    <li><FileJson className="inline h-3 w-3 mr-1" /> A JSON file (e.g., <code>diagram.json</code>)</li>
                    <li><FileText className="inline h-3 w-3 mr-1" /> A CSV file (e.g., <code>diagram.csv</code>)</li>
                    <li><Image className="inline h-3 w-3 mr-1" /> An image file with the same name (e.g., <code>diagram.png</code>)</li>
                  </ul>
                </li>
                <li>The files MUST have the same base name (e.g., <code>diagram.json</code>, <code>diagram.csv</code>, and <code>diagram.png</code>)</li>
                <li>The JSON file should contain the image name and coordinate data</li>
                <li>For image files, we support .png, .jpg, .jpeg, .webp, and .gif formats</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Example Folder Structure</h4>
              <pre className="text-xs text-gray-600">
                public/data/Your_Diagram_Name/<br/>
                ├── diagram.json<br/>
                ├── diagram.csv<br/>
                └── diagram.png
              </pre>
            </div>
            
            <Button onClick={handleScan} variant="outline">
              <FolderSearch className="h-4 w-4 mr-2" /> Scan Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.length > 0 ? (
            images.map((image) => (
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
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center p-8 border rounded-md">
              <AlertCircle className="h-10 w-10 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Diagrams Found</h3>
              <p className="text-center text-gray-600 mb-4">
                We couldn't detect any diagrams in the data directory.
              </p>
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="font-medium text-sm mb-2">How to Add Diagrams</h4>
                  <p className="text-sm text-gray-600 mb-2">Add your diagram files to:</p>
                  <code className="block bg-gray-100 p-2 rounded text-sm mb-2">
                    public/data/Your_Diagram_Name/
                  </code>
                  <p className="text-sm text-gray-600">Include matching JSON, CSV, and image files</p>
                </div>
                <Button onClick={handleScan} variant="outline">
                  <FolderSearch className="h-4 w-4 mr-2" /> Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageList;
