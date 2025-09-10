
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
import { 
  readIntelliPartsFromLocal, 
  parseRelatedMachines, 
  parseOtherPages,
  getMachineThumbnailFromDrive 
} from "@/utils/intelliPartsReader";
import { IntelliPartsItem } from "@/types";
import { ProductGrid } from "@/components/ProductGrid";
import dataCache from "@/utils/dataCache";

// Lazy load components to improve initial page load
const InteractiveImage = lazy(() => import("@/components/Interactive/InteractiveImage"));
const DataTable = lazy(() => import("@/components/Table/DataTable"));

// Machine Image Component for Related Machines
const MachineImage: React.FC<{ machineName: string }> = ({ machineName }) => {
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMachineImage = async () => {
      try {
        setIsLoading(true);
        
        // Create cache key for this machine thumbnail
        const cacheKey = `machineThumbnail:${machineName}`;
        
        // Check cache first
        const cachedUrl = dataCache.getImageUrl(cacheKey);
        if (cachedUrl) {
          setImageUrl(cachedUrl);
          setIsLoading(false);
          return;
        }
        
        // First, try to get machine thumbnail from Google Drive
        const driveMachineImage = await getMachineThumbnailFromDrive(machineName);
        if (driveMachineImage) {
          setImageUrl(driveMachineImage);
          dataCache.setImageUrl(cacheKey, driveMachineImage);
        } else {
          // Fallback to local machine thumbnail
          const machineThumbnailPath = `/IntelliParts/Machine Images/${machineName}.png`;
          const response = await fetch(machineThumbnailPath);
          if (response.ok) {
            setImageUrl(machineThumbnailPath);
            dataCache.setImageUrl(cacheKey, machineThumbnailPath);
          } else {
            setImageUrl('/placeholder.svg');
            dataCache.setImageUrl(cacheKey, '/placeholder.svg');
          }
        }
      } catch (error) {
        console.error('Error loading machine image:', error);
        setImageUrl('/placeholder.svg');
        const cacheKey = `machineThumbnail:${machineName}`;
        dataCache.setImageUrl(cacheKey, '/placeholder.svg');
      } finally {
        setIsLoading(false);
      }
    };

    loadMachineImage();
  }, [machineName]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={machineName}
      className="w-full h-full object-cover rounded-lg"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder.svg';
      }}
    />
  );
};


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
  const { data: intelliPartsItems } = useQuery({ 
    queryKey: ['intelliPartsData'], 
    queryFn: readIntelliPartsFromLocal, 
    staleTime: 5 * 60 * 1000 
  });

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

  // Get current IntelliParts item for related machines and other pages
  const currentIntelliPartsItem = useMemo(() => {
    if (!intelliPartsItems || !currentFolderName) return null;
    
    // Get query parameters to help uniquely identify the specific item
    const searchParams = new URLSearchParams(window.location.search);
    const qName = searchParams.get('name');
    const qMachine = searchParams.get('machine');
    const qBrand = searchParams.get('brand');
    
    // Try to find the IntelliParts item that matches the current folder
    // First try to match by sparepartspage_path AND additional identifiers for uniqueness
    let item = intelliPartsItems.find(item => {
      const pathMatches = item.sparepartspage_path === currentFolderName ||
                          item.sparepartspage_path === decodeURIComponent(currentFolderName);
      
      if (!pathMatches) return false;
      
      // If we have additional query parameters, use them to ensure uniqueness
      if (qName || qMachine || qBrand) {
        const nameMatches = !qName || item.sparepartspage_name === qName;
        const machineMatches = !qMachine || item.machine_name === qMachine;
        const brandMatches = !qBrand || item.brand === qBrand;
        
        return nameMatches && machineMatches && brandMatches;
      }
      
      return true;
    });
    
    // Fallback: if no unique match found, just use the first item with matching path
    if (!item) {
      item = intelliPartsItems.find(item => 
        item.sparepartspage_path === currentFolderName ||
        item.sparepartspage_path === decodeURIComponent(currentFolderName)
      );
    }
    
    return item;
  }, [intelliPartsItems, currentFolderName]);

  // Get related machines and other pages
  const relatedMachines = useMemo(() => {
    if (!currentIntelliPartsItem?.related_machines) return [];
    return parseRelatedMachines(currentIntelliPartsItem.related_machines);
  }, [currentIntelliPartsItem]);

  const otherPages = useMemo(() => {
    if (!currentIntelliPartsItem?.other_pages) return [];
    return parseOtherPages(currentIntelliPartsItem.other_pages);
  }, [currentIntelliPartsItem]);


  // Get other page items
  const otherPageItems = useMemo(() => {
    if (!intelliPartsItems || otherPages.length === 0) return [];
    
    const items = otherPages.map(pagePath => {
      // Find the item with this sparepartspage_path
      const pageItem = intelliPartsItems.find(item => 
        item.sparepartspage_path === pagePath
      );
      return pageItem;
    }).filter(Boolean);
    
    return items;
  }, [intelliPartsItems, otherPages]);

  // Get products to show in the scroller with graceful fallbacks
  const contextProducts = useMemo(() => {
    if (!intelliPartsItems || !currentIntelliPartsItem) return [];

    const params = new URLSearchParams(window.location.search);
    const selectedMachine = params.get('machine') || currentIntelliPartsItem.machine_name || '';

    // 1) Try: same category + subcategory + selected machine
    let candidates = intelliPartsItems.filter((item) =>
      item.category === currentIntelliPartsItem.category &&
      item.sub_category === currentIntelliPartsItem.sub_category &&
      (!!selectedMachine ? item.machine_name === selectedMachine : true)
    );

    // 2) Fallback: same category + subcategory (ignore machine) if none
    if (candidates.length === 0) {
      candidates = intelliPartsItems.filter((item) =>
        item.category === currentIntelliPartsItem.category &&
        item.sub_category === currentIntelliPartsItem.sub_category
      );
    }

    // 3) Fallback: same category (broadest) if still none
    if (candidates.length === 0) {
      candidates = intelliPartsItems.filter((item) =>
        item.category === currentIntelliPartsItem.category
      );
    }

    // Ensure current item is included even if not found by the filters
    const currentPath = currentIntelliPartsItem.sparepartspage_path;
    if (currentPath && !candidates.some((c) => c.sparepartspage_path === currentPath)) {
      candidates = [currentIntelliPartsItem, ...candidates];
    }

    // Return candidates in their original order (no sorting)
    // This ensures the order matches what users see on the Home page
    return candidates;
  }, [intelliPartsItems, currentIntelliPartsItem]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First check global product cache (persists across navigation)
        const cachedProductData = dataCache.getProductData(currentFolderName);
        if (cachedProductData) {
          console.log(`[Cache] Using cached product data for ${currentFolderName}`);
          setImageData(cachedProductData.imageData);
          setTableData(cachedProductData.tableData);
          setImagePath(cachedProductData.imagePath);
          setBaseName(cachedProductData.baseName);
          
          // If a specific part number is provided in the URL, highlight it
          if (partNumber) {
            const matchingRow = cachedProductData.tableData.find(row => row.partNumber === partNumber);
            if (matchingRow) {
              setHighlightedNumber(matchingRow.number);
            }
          }
          
          setLoading(false);
          return;
        }
        
        // Fallback to page cache (for backward compatibility)
        const cachedPageData = dataCache.getPageData(currentFolderName);
        if (cachedPageData) {
          console.log(`[Cache] Using cached page data for ${currentFolderName}`);
          setImageData(cachedPageData.imageData);
          setTableData(cachedPageData.tableData);
          setImagePath(cachedPageData.imagePath);
          setBaseName(cachedPageData.baseName);
          
          // If a specific part number is provided in the URL, highlight it
          if (partNumber) {
            const matchingRow = cachedPageData.tableData.find(row => row.partNumber === partNumber);
            if (matchingRow) {
              setHighlightedNumber(matchingRow.number);
            }
          }
          
          setLoading(false);
          return;
        }
        
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
            imageName: detectedBase.replace(/_/g, ' '),
            coordinates: []
          });
        }
        
        if (imgPath) {
          setImagePath(imgPath);
        } else {
          console.warn(`Could not locate image for: ${currentFolderName}/${detectedBase}`);
          toast.warning("Using placeholder image - actual image not found");
        }

        setTableData(tableRows);
        
        // Cache the data in both global product cache and page cache
        const pageData = {
          imageData: imgData,
          tableData: tableRows,
          imagePath: imgPath || '/placeholder.svg',
          baseName: detectedBase
        };
        
        // Store in global product cache (persists across navigation)
        dataCache.setProductData(currentFolderName, pageData);
        // Also store in page cache for backward compatibility
        dataCache.setPageData(currentFolderName, pageData);
        
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


  const handleIntelliPartsItemClick = (item: IntelliPartsItem) => {
    // Preload product data if not already cached
    if (!dataCache.hasProductData(item.sparepartspage_path)) {
      console.log(`[Cache] Preloading data for related item: ${item.sparepartspage_path}`);
    }
    
    // Navigate to the related item's folder with the same breadcrumb context
    // Use the current product's category, subcategory, and machine for the breadcrumb
    // IMPORTANT: Always include the specific item's identifying information to ensure uniqueness
    const query = new URLSearchParams({
      category: currentIntelliPartsItem?.category || item.category || '',
      subcategory: currentIntelliPartsItem?.sub_category || item.sub_category || '',
      machine: item.machine_name || '', // Use the clicked item's machine name
      name: item.sparepartspage_name || '', // Use the clicked item's name
      brand: item.brand || '' // Use the clicked item's brand
    }).toString();
    
    navigate(`/${encodeURIComponent(item.sparepartspage_path)}?${query}`);
  };

  const handleRelatedMachineClick = (item: IntelliPartsItem) => {
    // For related machines, navigate to the home page with machine filter
    navigate(`/?machine=${encodeURIComponent(item.machine_name)}`);
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

  // Build breadcrumb hierarchy with proper fallbacks
  const searchParams = new URLSearchParams(window.location.search);
  
  // Get the most complete hierarchy available
  const category = searchParams.get('category') || currentIntelliPartsItem?.category || currentProduct?.category;
  const subcategory = searchParams.get('subcategory') || currentIntelliPartsItem?.sub_category || currentProduct?.type;
  const machine = searchParams.get('machine') || currentIntelliPartsItem?.machine_name;
  const name = searchParams.get('name') || currentIntelliPartsItem?.sparepartspage_name || currentProduct?.product_name;

  // Build breadcrumb items with full hierarchy when available
  const breadcrumbItems = [];
  
  if (category) {
    breadcrumbItems.push({ 
      label: category, 
      path: `/?category=${encodeURIComponent(category)}` 
    });
  }
  
  if (subcategory && category) {
    breadcrumbItems.push({ 
      label: subcategory, 
      path: `/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}` 
    });
  }
  
  if (machine && category && subcategory) {
    breadcrumbItems.push({ 
      label: machine, 
      path: `/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}&machine=${encodeURIComponent(machine)}` 
    });
  }
  
  if (name) {
    breadcrumbItems.push({ 
      label: name, 
      path: '#' 
    });
  }
  

  return (
    <div className="container mx-auto px-4 pt-4 pb-6">
      <div className="mb-1">
        <Breadcrumb 
          items={breadcrumbItems} 
          products={contextProducts}
          currentProductPath={currentFolderName}
          onProductSelect={handleIntelliPartsItemClick}
        />
      </div>
      <h1 className="text-2xl font-bold mb-4 text-gray-900">
        {currentIntelliPartsItem?.sparepartspage_name || currentProduct?.product_name || currentProduct?.file_name || imageData.imageName.replace(/-/g, " ")}
      </h1>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/3">
          <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
            <Suspense fallback={<div className="w-full h-[520px] flex items-center justify-center">Loading image viewer...</div>}>
              <InteractiveImage
                imagePath={imagePath}
                imageData={imageData}
                highlightedNumber={highlightedNumber}
                onCircleHover={handleCircleHover}
                onCircleClick={handleCircleClick}
              />
            </Suspense>
          </div>
        </div>
        <div
          className="hidden lg:block w-full lg:w-1/3 bg-white p-3 rounded-lg shadow"
          style={{ minHeight: "520px", height: "100%" }}
        >
          <h2 className="text-lg font-semibold mb-1">Parts List</h2>
          <div
            style={{ height: "480px", maxHeight: "480px", overflow: "auto" }}
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
      
      {/* Related Machines Section - Machine Cards */}
      {relatedMachines.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Related Machines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedMachines.map((machineName) => (
              <div
                key={machineName}
                onClick={() => handleRelatedMachineClick({ machine_name: machineName } as IntelliPartsItem)}
                className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="aspect-[3/2] mb-3 bg-gray-100 rounded-md overflow-hidden">
                  <MachineImage machineName={machineName} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{machineName}</h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {currentIntelliPartsItem?.category || 'Industrial Equipment'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Parts Section - Using ProductGrid */}
      {otherPageItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Related Parts</h2>
          <div>
            <ProductGrid 
              items={otherPageItems} 
              onItemClick={handleIntelliPartsItemClick} 
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default ImageDetail;
