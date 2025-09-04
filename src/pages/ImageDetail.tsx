
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TableRow, ImageData } from "@/types";
import { parseCSVFile, loadImageData, getImagePath, checkFolderContents } from "@/utils/fileLoader";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { readIndexFromDrive, IndexItem } from "@/utils/indexReader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Lazy load components to improve initial page load
const InteractiveImage = lazy(() => import("@/components/Interactive/InteractiveImage"));
const DataTable = lazy(() => import("@/components/Table/DataTable"));

const ImageDetail: React.FC = () => {
  const { folderName, partNumber } = useParams<{ folderName: string; partNumber: string }>();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [imagePath, setImagePath] = useState<string>('/placeholder.svg');
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseName, setBaseName] = useState<string | null>(null);
  const { data: indexItems } = useQuery({ queryKey: ['indexData'], queryFn: readIndexFromDrive, staleTime: 5 * 60 * 1000 });

  // Handle full path from AmazonHome navigation (Google Drive paths from index.csv)
  const currentFolderName = folderName ? decodeURIComponent(folderName) : "";

  const numberToPartNumberMap = useMemo(() => {
    const map: Record<string, string> = {};
    tableData.forEach(row => {
      if (row.number && row.partNumber) {
        map[row.number] = row.partNumber;
      }
    });
    return map;
  }, [tableData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // For Google Drive paths from index.csv, extract the base name from the path
        const folderNameForFiles = currentFolderName;
        const detectedBase = currentFolderName.split('/').pop()!;
        setBaseName(detectedBase);
        
        console.log('Loading data for Google Drive folder:', folderNameForFiles);
        console.log('Detected base name:', detectedBase);
        
        // Load JSON, Image, CSV using the Google Drive paths
        const [imgData, imgPath, tableRows] = await Promise.all([
          loadImageData(folderNameForFiles, detectedBase),
          getImagePath(folderNameForFiles, detectedBase),
          parseCSVFile(folderNameForFiles, detectedBase)
        ]);

        // If we have image data, set it; otherwise show warning
        if (imgData) {
          setImageData(imgData);
        } else {
          console.warn(`No image metadata found for: ${currentFolderName}`);
          toast.warning("Interactive image features disabled - metadata not found");
          // Create a minimal image data structure for fallback
          setImageData({
            imageName: baseName.replace(/_/g, ' '),
            coordinates: []
          });
        }
        
        if (imgPath) {
          setImagePath(imgPath);
        } else {
          console.warn(`Could not locate image for: ${currentFolderName}/${baseName}`);
          toast.warning("Using placeholder image - actual image not found");
        }

        setTableData(tableRows);
        
        // If a specific part number is provided in the URL, highlight it
        if (partNumber) {
          const matchingRow = tableRows.find(row => row.partNumber === partNumber);
          if (matchingRow) {
            setHighlightedNumber(matchingRow.number);
          }
        }
        
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load data for this image";
        console.error("Error loading data:", errorMessage);
        setError(errorMessage);
        setLoading(false);
        toast.error("Error loading data: " + errorMessage);
      }
    };

    if (currentFolderName) {
      fetchData();
    }
  }, [currentFolderName, partNumber]);

  const handleCircleHover = (number: string | null) => setHighlightedNumber(number);
  const handleRowHover = (number: string | null) => setHighlightedNumber(number);

  const handleShapeOrRowClick = (number: string) => {
    const partNum = numberToPartNumberMap[number];
    if (!partNum) {
      toast.error("Part number not found for this item.");
      return;
    }
    const SWASTIK_URL = import.meta.env.VITE_SWASTIK_URL;
    const url = `${SWASTIK_URL}/search?q=${encodeURIComponent(partNum)}`;
    window.open(url, "_blank");
  };

  const handleCircleClick = handleShapeOrRowClick;
  const handleRowClick = handleShapeOrRowClick;

  // Scroll to top when component mounts (when navigating to new item)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentFolderName]); // Scroll to top when folder changes

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 bg-white p-4 rounded-lg shadow min-h-[580px]">
            <Skeleton className="w-full h-[580px]" />
          </div>
          <div className="w-full lg:w-1/3 bg-white p-4 rounded-lg shadow">
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error}</p>
          <Button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-custom-blue text-white rounded hover:bg-custom-blue-light"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-500 mb-4">No Data Available</h2>
          <p className="text-gray-600 mb-4">The requested data could not be loaded.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  // Prefer category/subcategory/name from query params for breadcrumbs
  const searchParams = new URLSearchParams(window.location.search);
  const qCategory = searchParams.get('category');
  const qSubcategory = searchParams.get('subcategory');
  const qName = searchParams.get('name');

  // Breadcrumb component already renders Home; only pass category/subcategory/name
  const breadcrumbItems = [
    ...(qCategory ? [{ label: qCategory, path: `/?category=${encodeURIComponent(qCategory)}` }] : []),
    ...(qSubcategory && qCategory ? [{ label: qSubcategory, path: `/?category=${encodeURIComponent(qCategory)}&subcategory=${encodeURIComponent(qSubcategory)}` }] : []),
    ...(qName ? [{ label: qName, path: '#' }] : [])
  ];
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      {(() => {
        // Find current item from indexItems to get file_name and description
        const current = indexItems?.find((it: IndexItem) => {
          // Try multiple matching strategies
          if (it.coordinates_path && decodeURIComponent(currentFolderName).includes(it.coordinates_path.split('/').slice(0,-1).join('/'))) {
            return true;
          }
          
          // Also try matching by asset_id if available
          if (it.asset_id && currentFolderName.includes(it.asset_id)) {
            return true;
          }
          
          return false;
        });

        return (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              {current?.file_name || imageData.imageName.replace(/-/g, " ")}
            </h1>
            {current?.description && (
              <p className="text-md text-gray-600 leading-relaxed">
                {current.description}
              </p>
            )}
          </div>
        );
      })()}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 bg-white p-4 rounded-lg shadow">
          <Suspense fallback={<div className="w-full h-[580px] flex items-center justify-center">Loading image viewer...</div>}>
            <InteractiveImage
              imagePath={imagePath}
              imageData={imageData}
              highlightedNumber={highlightedNumber}
              onCircleHover={handleCircleHover}
              onCircleClick={handleCircleClick}
            />
          </Suspense>
        </div>
        <div
          className="hidden lg:block w-full lg:w-1/3 bg-white p-4 rounded-lg shadow"
          style={{ minHeight: "580px", height: "100%" }}
        >
          <h2 className="text-lg font-semibold mb-2">Parts List</h2>
          <div
            style={{ height: "530px", maxHeight: "530px", overflow: "auto" }}
          >
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading parts data...</div>}>
              <DataTable
                data={tableData}
                highlightedNumber={highlightedNumber}
                onRowClick={handleRowClick}
                onRowHover={handleRowHover}
              />
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Mobile Parts List */}
      <div
        className="lg:hidden mt-6 bg-white p-4 rounded-lg shadow"
        style={{ minHeight: "200px" }}
      >
        <h2 className="text-lg font-semibold mb-2">Parts List</h2>
        <div style={{ maxHeight: "530px", overflow: "auto" }}>
          <Suspense fallback={<div className="w-full h-64 flex items-center justify-center">Loading parts data...</div>}>
            <DataTable
              data={tableData}
              highlightedNumber={highlightedNumber}
              onRowClick={handleRowClick}
              onRowHover={handleRowHover}
            />
          </Suspense>
        </div>
      </div>
      
      {/* Related Content - now below the parts list */}
      {indexItems && imageData && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Related Content</h3>
          {(() => {
            // Find current item by matching coordinates_path in query
            const current = indexItems.find((it: IndexItem) => {
              // Try multiple matching strategies
              if (it.coordinates_path && decodeURIComponent(currentFolderName).includes(it.coordinates_path.split('/').slice(0,-1).join('/'))) {
                return true;
              }
              
              // Also try matching by asset_id if available
              if (it.asset_id && currentFolderName.includes(it.asset_id)) {
                return true;
              }
              
              return false;
            });
            
            const relatedIds = current?.related_ids || [];
            
            const related = relatedIds
              .map((rid: string) => {
                // Look for items where asset_id matches the related ID
                const found = indexItems.find((it: IndexItem) => it.asset_id === rid);
                if (found) {
                  console.log('Found related item:', {
                    asset_id: found.asset_id,
                    file_name: found.file_name,
                    thumbnail_path: found.thumbnail_path,
                    image_path: found.image_path
                  });
                }
                return found;
              })
              .filter(Boolean) as IndexItem[];

            if (!related || related.length === 0) {
              return <p className="text-sm text-gray-500">No related items found.</p>;
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {related.map((item) => (
                  <div key={`${item.category}-${item.subcategory}-${item.file_name}`} className="flex flex-col p-4 border rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => {
                      // Navigate to the related item's detail page
                      if (item.coordinates_path) {
                        const pathParts = item.coordinates_path.split('/');
                        const folderPath = pathParts.slice(0, -1).join('/');
                        const q = new URLSearchParams({ category: item.category || '', subcategory: item.subcategory || '', name: item.file_name || '' }).toString();
                        navigate(`/${encodeURIComponent(folderPath)}?${q}`);
                        // Scroll to top when navigating to new page
                        window.scrollTo(0, 0);
                      }
                    }}
                  >
                    <img 
                      src={item.thumbnail_path || item.image_path || '/placeholder.svg'} 
                      className="w-full h-32 object-cover rounded mb-3" 
                      onError={(e) => { 
                        const img = e.target as HTMLImageElement;
                        console.log('Image load error for:', item.file_name, {
                          thumbnail_path: item.thumbnail_path,
                          image_path: item.image_path,
                          currentSrc: img.src
                        });
                        // Prevent infinite error loops by checking if we've already tried this source
                        if (img.dataset.fallbackAttempted === 'true') {
                          // Already tried fallback, use placeholder
                          img.src = '/placeholder.svg';
                        } else if (item.image_path && img.src !== item.image_path) {
                          // Try image_path as fallback
                          img.dataset.fallbackAttempted = 'true';
                          img.src = item.image_path;
                        } else {
                          // Use placeholder
                          img.src = '/placeholder.svg';
                        }
                      }} 
                      onLoad={() => {
                        console.log('Image loaded successfully for:', item.file_name, {
                          thumbnail_path: item.thumbnail_path,
                          image_path: item.image_path
                        });
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">{item.file_name}</div>
                      <div className="text-xs text-gray-500 mb-2">{item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}</div>
                      {item.description && (
                        <div className="text-xs text-gray-600 line-clamp-2">{item.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ImageDetail;
