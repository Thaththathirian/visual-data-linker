
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
export const getImagePath = (fileName: string) => {
  // Strip any extension from the filename if present
  const baseName = fileName.includes('.') ? 
    fileName.substring(0, fileName.lastIndexOf('.')) : 
    fileName;
  
  return `/images/${baseName}.jpg`; // Default to jpg
};

/**
 * Check if an image exists with various extensions
 */
export const checkImageExists = async (fileName: string): Promise<string | null> => {
  // Strip any extension from the filename if present
  const baseName = fileName.includes('.') ? 
    fileName.substring(0, fileName.lastIndexOf('.')) : 
    fileName;
    
  // Try different common image extensions
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  for (const ext of extensions) {
    const url = `/images/${baseName}${ext}`;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Found image at: ${url}`);
        return url;
      }
    } catch (err) {
      console.log(`Image not found at: ${url}`);
    }
  }
  
  console.error(`No image found for ${baseName} with any of the supported extensions`);
  return null;
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
