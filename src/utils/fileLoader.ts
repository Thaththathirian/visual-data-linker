import * as XLSX from "xlsx";
import { TableRow, ImageData } from "@/types";

/**
 * Gets the appropriate table path based on environment
 */
export const getTablePath = (fileName: string) => {
  const isProd = import.meta.env.PROD;
  return isProd ? `/tables/${fileName}` : `/src/data/tables/${fileName}`;
};

/**
 * Gets the appropriate image path with fallback for different extensions
 */
export const getImagePath = async (fileName: string): Promise<string | null> => {
  // Strip any extension from the filename if present
  const baseName = fileName.includes('.') ? 
    fileName.substring(0, fileName.lastIndexOf('.')) : 
    fileName;
  
  // Try different common image extensions
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // Try direct URL first without checking (most reliable method)
  for (const ext of extensions) {
    const url = `/images/${baseName}${ext}`;
    console.log(`Attempting direct image access at: ${url}`);
    
    // Create an image element to test if the image loads
    try {
      const img = new Image();
      const imagePromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      
      img.src = url;
      const exists = await imagePromise;
      
      if (exists) {
        console.log(`Success! Image loaded at: ${url}`);
        return url;
      }
    } catch (err) {
      console.log(`Error testing image at ${url}:`, err);
    }
  }
  
  // Fallback to development paths
  if (!import.meta.env.PROD) {
    for (const ext of extensions) {
      const url = `/src/data/images/${baseName}${ext}`;
      try {
        console.log(`Trying development path: ${url}`);
        const img = new Image();
        const imagePromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        
        img.src = url;
        const exists = await imagePromise;
        
        if (exists) {
          console.log(`Success! Image loaded at development path: ${url}`);
          return url;
        }
      } catch (err) {
        console.log(`Error testing dev image at ${url}:`, err);
      }
    }
  }
  
  // Final fallback - try absolute URLs
  const origin = window.location.origin;
  for (const ext of extensions) {
    const url = `${origin}/images/${baseName}${ext}`;
    try {
      console.log(`Trying absolute URL: ${url}`);
      const img = new Image();
      const imagePromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      
      img.src = url;
      const exists = await imagePromise;
      
      if (exists) {
        console.log(`Success! Image loaded at absolute URL: ${url}`);
        return url;
      }
    } catch (err) {
      console.log(`Error testing absolute URL image at ${url}:`, err);
    }
  }
  
  console.error(`No valid image found for ${baseName} after trying all options`);
  
  // Return a default placeholder image instead of null
  return `/placeholder.svg`;
};

/**
 * Check if an image exists with various extensions
 * @deprecated Use getImagePath instead which returns the correct path directly
 */
export const checkImageExists = async (fileName: string): Promise<string | null> => {
  return getImagePath(fileName);
};

/**
 * Dynamically parse XLSX table data
 */
export const parseXLSXTable = async (fileName: string): Promise<TableRow[]> => {
  try {
    // Strip any extension if present and add .xlsx
    const baseName = fileName.includes('.') ? 
      fileName.substring(0, fileName.lastIndexOf('.')) : 
      fileName;
    const xlsxFileName = `${baseName}.xlsx`;
    
    const filePath = getTablePath(xlsxFileName);
    console.log(`Fetching XLSX file from: ${filePath}`);

    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(
        `Failed to load table: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to load table from ${filePath}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    console.log(`Successfully parsed XLSX with ${json.length} rows for ${baseName}`);

    return json.map((row, idx) => {
      const tableRow: TableRow = {
        id: idx + 1,
        number: String(row["Number"] || ""),
        name: String(row["Qty"] || ""),
        description: String(row["Description"] || ""),
        partNumber: String(row["Part No."] || ""),
      };
      return tableRow;
    });
  } catch (err) {
    console.error("Error in parseXLSXTable:", err);
    return [];
  }
};

/**
 * Load image data (JSON) dynamically
 */
export const loadImageData = async (imageName: string): Promise<ImageData | null> => {
  try {
    // Strip any extension if present
    const baseName = imageName.includes('.') ? 
      imageName.substring(0, imageName.lastIndexOf('.')) : 
      imageName;
      
    console.log(`Loading image data for: ${baseName}`);
    const module = await import(`../data/images/${baseName}.json`);
    console.log(`Successfully loaded image data for ${baseName}`);
    return module.default as ImageData;
  } catch (err) {
    console.error(`Error loading image data for ${imageName}:`, err);
    return null;
  }
};

/**
 * Fetches all available image data files
 */
export const getAvailableImageFiles = async (): Promise<string[]> => {
  try {
    // In a real-world scenario, you might use an API endpoint
    // to retrieve a list of available files
    // For now, we'll use a static import.meta.glob to get all JSON files
    const imageModules = import.meta.glob('../data/images/*.json');
    const imageFiles: string[] = [];
    
    console.log("Checking available image JSON files...");
    console.log("Found modules:", Object.keys(imageModules).length);
    
    for (const path in imageModules) {
      if (path.endsWith('.json')) {
        // Extract the filename without extension
        const match = path.match(/\/([^/]+)\.json$/);
        if (match && match[1]) {
          imageFiles.push(match[1]);
          console.log(`Found image JSON: ${match[1]}`);
        }
      }
    }
    
    return imageFiles;
  } catch (err) {
    console.error('Error getting available image files:', err);
    return [];
  }
};
