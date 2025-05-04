import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";
import { toast } from "sonner";

// Create a simple cache to avoid repeated network requests
const cache: Record<string, any> = {};
const CACHE_TIMEOUT = 60 * 1000; // 1 minute cache
const cacheTimestamps: Record<string, number> = {};

/**
 * Cached fetch to avoid redundant network requests
 */
const cachedFetch = async (url: string, options = {}): Promise<Response> => {
  const cacheKey = `fetch:${url}`;
  
  // Check if we have a cached response that's still valid
  if (cache[cacheKey] && cacheTimestamps[cacheKey] && 
      Date.now() - cacheTimestamps[cacheKey] < CACHE_TIMEOUT) {
    console.log(`Using cached response for ${url}`);
    return cache[cacheKey].clone(); // Return a clone to avoid consuming the body
  }
  
  // Make the actual fetch request
  try {
    const response = await fetch(url, options);
    
    // Only cache successful responses
    if (response.ok) {
      // Clone the response so we can use it multiple times
      const responseClone = response.clone();
      cache[cacheKey] = responseClone;
      cacheTimestamps[cacheKey] = Date.now();
    }
    
    return response;
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    throw err;
  }
};

// Cache for parsed JSON data
const jsonDataCache: Record<string, any> = {};

/**
 * Gets the appropriate base path for data files - same path for both dev and prod
 */
const getBasePath = (): string => {
  // Use a consistent data path for both development and production
  return '/data';
};

/**
 * Gets the appropriate table path based on the folder name and file name
 */
export const getTablePath = (folderName: string, fileName: string) => {
  const basePath = getBasePath();
  return `${basePath}/${folderName}/${fileName}.csv`;
};

/**
 * Gets the appropriate image path with fallback for different extensions
 */
export const getImagePath = async (folderName: string, fileName: string): Promise<string | null> => {
  // Strip any extension from the filename if present
  const baseName = fileName.includes('.') ? 
    fileName.substring(0, fileName.lastIndexOf('.')) : 
    fileName;
  
  const basePath = getBasePath();
  
  // Try different common image extensions
  const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  
  // Try to find the file with the exact same base name as JSON/CSV files
  for (const ext of extensions) {
    const url = `${basePath}/${folderName}/${baseName}${ext}`;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return url;
      }
    } catch (err) {
      // Continue trying other extensions
    }
  }
  
  return null;
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

    const basePath = getBasePath();
    const filePath = `${basePath}/${folderName}/${baseName}.csv`;
    
    try {
      // Use cached fetch to avoid redundant requests
      const response = await cachedFetch(filePath);
      
      if (!response.ok) {
        console.error(`Failed to load CSV: ${response.status} ${response.statusText}`);
        return [];
      }

      const csvText = await response.text();
      const parsedData = parseCSV(csvText);

      return parsedData;
    } catch (err) {
      console.error("Error fetching CSV file:", err);
      return [];
    }
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
    // Create a cache key for this specific JSON file
    const cacheKey = `jsonData:${folderName}/${fileName}`;
    
    // Check if we have this JSON data cached
    if (jsonDataCache[cacheKey]) {
      return jsonDataCache[cacheKey];
    }
    
    // Strip any extension if present
    const baseName = fileName.includes('.') ? 
      fileName.substring(0, fileName.lastIndexOf('.')) : 
      fileName;
    
    const basePath = getBasePath();
    const jsonPath = `${basePath}/${folderName}/${baseName}.json`;
    
    try {
      // Use cached fetch to avoid redundant requests, and get a fresh clone of the response
      const response = await cachedFetch(jsonPath);
      
      if (!response.ok) {
        console.error(`Failed to load JSON with status ${response.status}`);
        return null;
      }
      
      // Get the raw text once
      const rawText = await response.text();
      
      if (!rawText || rawText.trim() === '') {
        console.error(`Empty JSON response from ${jsonPath}`);
        return null;
      }
      
      // Try to parse the JSON
      try {
        // Parse JSON after ensuring no BOM and properly trimmed
        const jsonData = JSON.parse(rawText.trim().replace(/^\uFEFF/, ''));
        
        // Return the data if it's valid
        if (jsonData && typeof jsonData === 'object' && 
            typeof jsonData.imageName === 'string' && 
            Array.isArray(jsonData.coordinates)) {
          // Store in cache before returning
          jsonDataCache[cacheKey] = jsonData;
          return jsonData;
        } else {
          console.error(`Invalid JSON data structure in ${jsonPath}`);
          return null;
        }
      } catch (parseError) {
        console.error(`JSON parse error for ${jsonPath}:`, parseError);
        return null;
      }
    } catch (err) {
      console.error(`Error loading JSON data:`, err);
      return null;
    }
  } catch (err) {
    console.error(`Error processing image data:`, err);
    return null;
  }
};

/**
 * Scan the data directory to find all available folders automatically
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    const basePath = getBasePath();
    const dataFolders: string[] = [];
    
    // Request the directory listing
    try {
      const response = await fetch(`${basePath}/`);
      
      if (response.ok) {
        const html = await response.text();
        // Extract folder names from directory listing
        const folderPattern = /href="([^"\.][^"]*?)\/?"/g;
        const matches = [...html.matchAll(folderPattern)];
        
        for (const match of matches) {
          const folderName = match[1].replace(/\/$/, ''); // Remove trailing slash
          if (!folderName.includes('.') && folderName !== '..' && folderName !== '') {
            dataFolders.push(folderName);
          }
        }
      } else {
        console.warn("Could not get directory listing, trying direct folder access");
      }
    } catch (err) {
      console.warn("Error fetching directory listing:", err);
    }
    
    // If no folders detected via directory listing, try scanning common folders
    if (dataFolders.length === 0) {
      // Try accessing some common test folders directly
      const testFolders = [
        'Brother_814_Needle_Bar_Mechanism',
        'test2_Brother_814_Needle_Bar_Mechanism',
        'test3_Brother_814_Needle_Bar_Mechanism',
        'test4_Brother_814_Needle_Bar_Mechanism'
      ];
      
      for (const folder of testFolders) {
        try {
          // Try to fetch a folder to see if it exists
          const response = await fetch(`${basePath}/${folder}/`);
          if (response.ok || response.status === 404) {
            // Even if we get a 404, the folder might exist but not return a directory listing
            // We'll check for actual content in the next step
            dataFolders.push(folder);
          }
        } catch (err) {
          // Ignore error and continue
        }
      }
    }
    
    // Filter folders to only include those with valid data files
    const validFolders: string[] = [];
    for (const folder of dataFolders) {
      const { hasJson } = await checkFolderContents(folder);
      if (hasJson) {
        validFolders.push(folder);
      }
    }
    
    return validFolders;
  } catch (err) {
    console.error("Error getting available folders:", err);
    return [];
  }
};

/**
 * Check if a folder has the required files (JSON, image)
 */
export const checkFolderContents = async (folderName: string): Promise<{
  hasJson: boolean;
  hasCsv: boolean;
  hasImage: boolean;
  baseName: string | null;
}> => {
  try {
    const basePath = getBasePath();
    let fileList: string[] = [];
    
    // Try to get file listing
    try {
      const response = await fetch(`${basePath}/${folderName}/`);
      if (response.ok) {
        const html = await response.text();
        const filePattern = /href="([^"]+)"/g;
        const matches = [...html.matchAll(filePattern)];
        fileList = matches
          .map(match => match[1])
          .filter(file => file.includes('.') && !file.includes('..'));
      }
    } catch (err) {
      console.warn(`Could not get file listing for ${folderName}:`, err);
    }
    
    // Look for JSON files first
    const jsonFiles = fileList.filter(file => file.endsWith('.json'));
    if (jsonFiles.length > 0) {
      const jsonFile = jsonFiles[0];
      const baseName = jsonFile.substring(0, jsonFile.lastIndexOf('.'));
      
      // Check if matching CSV and image files exist
      const hasCsv = fileList.some(file => file === `${baseName}.csv`);
      const hasImage = fileList.some(file => 
        ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(ext => 
          file === `${baseName}${ext}`
        )
      );
      
      return { hasJson: true, hasCsv, hasImage, baseName };
    }
    
    // If no files were found in the listing or no JSON, try to check for common filenames
    if (fileList.length === 0 || jsonFiles.length === 0) {
      // Try common base names
      const commonBaseNames = [
        'diagram',
        'Brother814_Needle_Bar_Mechanism',
        'data',
        'parts',
        folderName
      ];
      
      for (const baseName of commonBaseNames) {
        // Check for JSON file
        try {
          const jsonResponse = await fetch(`${basePath}/${folderName}/${baseName}.json`, { method: 'HEAD' });
          if (jsonResponse.ok) {
            // Found a JSON file, now check for matching CSV and image
            let hasCsv = false;
            let hasImage = false;
            
            try {
              const csvResponse = await fetch(`${basePath}/${folderName}/${baseName}.csv`, { method: 'HEAD' });
              hasCsv = csvResponse.ok;
            } catch (err) {
              // Ignore CSV check error
            }
            
            // Check for images with different extensions
            for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
              try {
                const imgResponse = await fetch(`${basePath}/${folderName}/${baseName}${ext}`, { method: 'HEAD' });
                if (imgResponse.ok) {
                  hasImage = true;
                  break;
                }
              } catch (err) {
                // Continue checking other extensions
              }
            }
            
            return { hasJson: true, hasCsv, hasImage, baseName };
          }
        } catch (err) {
          // Continue checking other base names
        }
      }
    }
    
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};
