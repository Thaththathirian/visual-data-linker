
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getAvailableFolders, checkFolderContents, loadImageData, clearCache } from '@/utils/fileLoader';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FolderSearch, FileText, FileJson, Image } from "lucide-react";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

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
  const [troubleshootingInfo, setTroubleshootingInfo] = useState<string[]>([]);

  const loadImages = useCallback(async () => {
    try {
      if (loading && !loadingComplete) {
        setError(null);
        setTroubleshootingInfo([]);
        const issues: string[] = [];
        
        // Get available folders
        const folders = await getAvailableFolders();
        console.log('Found folders:', folders);
        
        if (folders.length === 0) {
          setError("No folders were detected. Please ensure your data files are in the correct location.");
          setLoading(false);
          return;
        }
        
        const imageDetails: ImageListItem[] = [];
        const failedFolders: string[] = []; // Track folders that failed to load
        
        // Process each folder one at a time to avoid parallel requests issues
        for (const folder of folders) {
          try {
            // Check if folder has required files
            const { hasJson, hasCsv, hasImage, baseName } = await checkFolderContents(folder);
            
            if (!hasJson) {
              failedFolders.push(folder);
              issues.push(`Folder "${folder}": No valid JSON file found`);
              continue;
            }
            
            if (!baseName) {
              failedFolders.push(folder);
              issues.push(`Folder "${folder}": JSON file exists but couldn't determine base name`);
              continue;
            }
            
            if (!hasCsv) {
              issues.push(`Folder "${folder}": Missing CSV file with name "${baseName}.csv"`);
            }
            
            if (!hasImage) {
              issues.push(`Folder "${folder}": Missing image file with name "${baseName}.[png/jpg/jpeg/webp/gif]"`);
            }
            
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
              } else {
                failedFolders.push(folder);
                issues.push(`Folder "${folder}": JSON file "${baseName}.json" exists but contains invalid data or HTML instead of JSON`);
              }
            } catch (jsonErr) {
              failedFolders.push(folder);
              console.error(`Error parsing JSON for ${folder}/${baseName}:`, jsonErr);
              issues.push(`Folder "${folder}": Error parsing JSON data: ${jsonErr.message}`);
            }
          } catch (folderErr) {
            failedFolders.push(folder);
            console.error(`Error processing folder ${folder}:`, folderErr);
            issues.push(`Folder "${folder}": General error: ${folderErr.message}`);
          }
          
          // Add a small delay between folder processing to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        setImages(imageDetails);
        setTroubleshootingInfo(issues);
        
        if (imageDetails.length === 0) {
          if (failedFolders.length > 0) {
            setError(`No valid diagram data could be loaded. We found ${failedFolders.length} folders but they contained invalid or missing files.`);
          } else {
            setError("No valid diagram data could be loaded. Make sure your data files are in the public folder.");
          }
        }
        
        setLoadingComplete(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading image list:', err);
      setError(`Failed to load image list: ${err.message}`);
      setLoading(false);
    }
  }, [loading, loadingComplete]);

  useEffect(() => {
    loadImages();
  }, [loadImages]); 

  // Function to reload the folder list
  const handleScan = () => {
    // Clear all caches
    clearCache();
    
    setLoadingComplete(false);
    setLoading(true);
    setImages([]);
    setTroubleshootingInfo([]);
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
        <LoadingState />
      ) : error ? (
        <ErrorState 
          error={error}
          troubleshootingInfo={troubleshootingInfo}
          onRescan={handleScan}
        />
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
            <EmptyState onRescan={handleScan} />
          )}
        </div>
      )}
    </div>
  );
};

export default ImageList;
