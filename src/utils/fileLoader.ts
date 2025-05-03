
import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";

/**
 * Gets the appropriate table path based on environment
 */
export const getTablePath = (folderName: string, fileName: string) => {
  const isProd = import.meta.env.PROD;
  return isProd ? 
    `/data/${folderName}/${fileName}.csv` : 
    `/src/data/${folderName}/${fileName}.csv`;
};

/**
 * Gets the appropriate image path with fallback for different extensions
 */
export const getImagePath = async (folderName: string, fileName: string): Promise<string | null> => {
  // Strip any extension from the filename if present
  const baseName = fileName.includes('.') ? 
    fileName.substring(0, fileName.lastIndexOf('.')) : 
    fileName;
  
  // Try different common image extensions
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // Try direct URL first without checking (most reliable method)
  for (const ext of extensions) {
    // Try with folder structure
    const url = `/images/${folderName}/${baseName}${ext}`;
    console.log(`Attempting image access at: ${url}`);
    
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
      // Try directly in the folder
      const url = `/src/data/${folderName}/${baseName}${ext}`;
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
    const url = `${origin}/images/${folderName}/${baseName}${ext}`;
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
  
  console.error(`No valid image found for ${folderName}/${baseName} after trying all options`);
  
  // Return a default placeholder image
  return `/placeholder.svg`;
};

/**
 * Parse CSV file directly
 */
export const parseCSVFile = async (folderName: string, fileName: string): Promise<TableRow[]> => {
  try {
    // Strip any extension if present and add .csv
    const baseName = fileName.includes('.') ? 
      fileName.substring(0, fileName.lastIndexOf('.')) : 
      fileName;
    const csvFileName = `${baseName}.csv`;
    
    const filePath = getTablePath(folderName, baseName);
    console.log(`Fetching CSV file from: ${filePath}`);

    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load CSV from ${filePath}`);
    }

    const csvText = await response.text();
    const parsedData = parseCSV(csvText);
    console.log(`Successfully parsed CSV with ${parsedData.length} rows for ${baseName}`);

    return parsedData;
  } catch (err) {
    console.error("Error parsing CSV file:", err);
    return [];
  }
};

/**
 * Load image JSON data dynamically from a specified folder
 */
export const loadImageData = async (folderName: string, fileName: string): Promise<ImageData | null> => {
  try {
    // Strip any extension if present
    const baseName = fileName.includes('.') ? 
      fileName.substring(0, fileName.lastIndexOf('.')) : 
      fileName;
      
    console.log(`Loading image data for: ${folderName}/${baseName}`);
    
    // Check if we're in development or production mode
    const isProd = import.meta.env.PROD;
    let jsonData;
    
    if (isProd) {
      // In production, load from public/data folder
      const response = await fetch(`/data/${folderName}/${baseName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load JSON from /data/${folderName}/${baseName}.json`);
      }
      jsonData = await response.json();
    } else {
      // In development, try to load from src/data folder
      try {
        const module = await import(`../data/${folderName}/${baseName}.json`);
        jsonData = module.default;
      } catch (err) {
        console.error(`Failed to import JSON module for ${folderName}/${baseName}:`, err);
        throw err;
      }
    }
    
    console.log(`Successfully loaded image data for ${folderName}/${baseName}`);
    return jsonData as ImageData;
  } catch (err) {
    console.error(`Error loading image data for ${folderName}/${fileName}:`, err);
    return null;
  }
};

/**
 * Get available folders that may contain diagram data
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    // In production, we would need an API endpoint to list folders
    // For development, we'll use import.meta.glob to scan directories
    const isProd = import.meta.env.PROD;
    
    if (isProd) {
      // For production, we'd need a server endpoint or a manifest file
      // This is a simplified approach - in real production you'd need a server endpoint
      try {
        const response = await fetch('/data/folders.json');
        if (response.ok) {
          const data = await response.json();
          return data.folders || [];
        }
      } catch (err) {
        console.error('Error fetching folders list:', err);
      }
      return [];
    } else {
      // For development, use Vite's import.meta.glob to scan folders
      const modules = import.meta.glob('../data/*/');
      console.log('Found folder modules:', Object.keys(modules));
      
      // Extract folder names from the paths
      const folders = Object.keys(modules).map(path => {
        // Extract folder name from path like '../data/folder_name/'
        const match = path.match(/\.\.\/data\/([^/]+)\//);
        return match ? match[1] : null;
      }).filter((folder): folder is string => folder !== null);
      
      console.log('Available folders:', folders);
      return folders;
    }
  } catch (err) {
    console.error('Error scanning for folders:', err);
    return [];
  }
};

/**
 * Check if a folder has the required files (JSON, CSV, image)
 */
export const checkFolderContents = async (folderName: string): Promise<{
  hasJson: boolean;
  hasCsv: boolean;
  hasImage: boolean;
  baseName: string | null;
}> => {
  try {
    // For development mode
    const isProd = import.meta.env.PROD;
    let baseName = null;
    let hasJson = false;
    let hasCsv = false;
    let hasImage = false;
    
    if (!isProd) {
      // Use import.meta.glob to check for files in this folder
      const jsonFiles = import.meta.glob(`../data/${folderName}/*.json`);
      const csvFiles = import.meta.glob(`../data/${folderName}/*.csv`);
      
      // Check if JSON files exist
      const jsonFilePaths = Object.keys(jsonFiles);
      if (jsonFilePaths.length > 0) {
        hasJson = true;
        // Extract base name from the first JSON file
        const jsonMatch = jsonFilePaths[0].match(/([^/]+)\.json$/);
        if (jsonMatch) {
          baseName = jsonMatch[1];
        }
      }
      
      // Check if CSV files exist
      if (Object.keys(csvFiles).length > 0) {
        hasCsv = true;
      }
      
      // For images, we'll need to actually try loading one
      if (baseName) {
        const imagePath = await getImagePath(folderName, baseName);
        hasImage = imagePath !== null && !imagePath.includes('placeholder');
      }
    } else {
      // For production, we would need to fetch a manifest or make requests
      // This is simplified - in real production you'd need server support
      try {
        const response = await fetch(`/data/${folderName}/manifest.json`);
        if (response.ok) {
          const manifest = await response.json();
          return {
            hasJson: manifest.hasJson || false,
            hasCsv: manifest.hasCsv || false,
            hasImage: manifest.hasImage || false,
            baseName: manifest.baseName || null
          };
        }
      } catch (err) {
        console.error(`Error checking folder contents for ${folderName}:`, err);
      }
    }
    
    console.log(`Folder ${folderName} check: JSON: ${hasJson}, CSV: ${hasCsv}, Image: ${hasImage}, Base name: ${baseName}`);
    return { hasJson, hasCsv, hasImage, baseName };
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};
