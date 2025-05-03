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
  
  for (const ext of extensions) {
    // Try both production and development paths
    const paths = [
      `/images/${baseName}${ext}`, // Production path
      `/src/data/images/${baseName}${ext}` // Dev path (if applicable)
    ];
    
    for (const url of paths) {
      try {
        console.log(`Trying to load image from: ${url}`);
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`Image found at: ${url}`);
          return url;
        }
      } catch (err) {
        console.log(`Image not found at: ${url}`);
      }
    }
  }
  
  // If we got here, we couldn't find the image with any extension
  console.error(`No valid image found for ${baseName} with tried extensions`);
  
  // As a last resort, just return a path with .jpg and hope the browser handles it
  // The browser will show a broken image icon if it fails
  return `/images/${baseName}.jpg`;
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
