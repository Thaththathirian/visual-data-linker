
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
import { RelatedParts } from "@/components/RelatedParts";

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
        
        // For Google Drive paths from index.csv, use the relative product name directly
        const relativeProductForFiles = currentFolderName;
        const detectedBase = currentFolderName;
        setBaseName(detectedBase);
        
        console.log('Loading data for Google Drive folder:', relativeProductForFiles);
        console.log('Detected base name:', detectedBase);
        
        // Load JSON, Image, CSV using the Google Drive paths with automatic file detection
        const [imgData, imgPath, tableRows] = await Promise.all([
          loadImageData(relativeProductForFiles, detectedBase),
          getImagePath(relativeProductForFiles, detectedBase),
          parseCSVFile(relativeProductForFiles, detectedBase)
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

  const handleRelatedPartClick = (item: IndexItem) => {
    if (item.product_path) {
      // Navigate to the related product's folder (using product_path as folder name)
      navigate(`/${encodeURIComponent(item.product_path)}`);
    }
  };

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

  // Get current product info for breadcrumbs
  const currentProduct = indexItems?.find((it: IndexItem) => {
    // Try multiple matching strategies
    // For new structure, match by product_path (which is the folder name)
    if (it.product_path && decodeURIComponent(currentFolderName) === it.product_path) {
      return true;
    }
    
    // For legacy structure, try coordinates_path
    if (it.coordinates_path && decodeURIComponent(currentFolderName).includes(it.coordinates_path.split('/').slice(0,-1).join('/'))) {
      return true;
    }
    
    // Also try matching by asset_id if available
    if (it.asset_id && currentFolderName.includes(it.asset_id)) {
      return true;
    }
    
    return false;
  });

  // Prefer category/subcategory/name from query params, fallback to current product data
  const searchParams = new URLSearchParams(window.location.search);
  const qCategory = searchParams.get('category') || currentProduct?.category;
  const qSubcategory = searchParams.get('subcategory') || currentProduct?.type;
  const qName = searchParams.get('name') || currentProduct?.product_name;

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          {currentProduct?.product_name || currentProduct?.file_name || imageData.imageName.replace(/-/g, " ")}
        </h1>
        {currentProduct?.product_description && (
          <p className="text-md text-gray-600 leading-relaxed">
            {currentProduct.product_description}
          </p>
        )}
      </div>
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
      
      {/* Related Parts - now below the parts list */}
      {indexItems && imageData && currentProduct && (
        <div className="mt-8">
          <RelatedParts
            currentItem={currentProduct}
            allItems={indexItems}
            onPartClick={handleRelatedPartClick}
          />
        </div>
      )}
    </div>
  );
};

export default ImageDetail;
