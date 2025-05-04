
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
const folderExistsCache: Record<string, boolean> = {};
const folderContentsCache: Record<string, any> = {};

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
      
      // Check if the response is HTML instead of CSV
      if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
        console.error(`Received HTML instead of CSV for ${filePath}`);
        return [];
      }
      
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
      // Use a regular fetch instead of cached fetch to avoid the "body already read" error
      const response = await fetch(jsonPath);
      
      if (!response.ok) {
        console.error(`Failed to load JSON with status ${response.status} for ${jsonPath}`);
        return null;
      }
      
      // Get the raw text
      const rawText = await response.text();
      
      if (!rawText || rawText.trim() === '') {
        console.error(`Empty JSON response from ${jsonPath}`);
        return null;
      }
      
      // Check if the response is HTML instead of JSON
      if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
        console.error(`Received HTML instead of JSON for ${jsonPath}`);
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
      console.error(`Error loading JSON data for ${jsonPath}:`, err);
      return null;
    }
  } catch (err) {
    console.error(`Error processing image data:`, err);
    return null;
  }
};

/**
 * Check if a folder exists by trying to access it
 */
const folderExists = async (folderPath: string): Promise<boolean> => {
  if (folderExistsCache[folderPath] !== undefined) {
    return folderExistsCache[folderPath];
  }
  
  try {
    const response = await fetch(folderPath, { method: 'HEAD' });
    const exists = response.ok;
    folderExistsCache[folderPath] = exists;
    return exists;
  } catch (err) {
    folderExistsCache[folderPath] = false;
    return false;
  }
};

/**
 * Scan the data directory to find all available folders automatically
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    const basePath = getBasePath();
    
    // Try to get a list of all data files by checking for a common path pattern
    // Instead of scanning for directories, check for known JSON files directly
    
    // Try to find folders using a HEAD request on the data directory
    const dataFolders: string[] = [];
    
    // This approach requires a directory listing, which may not work on all servers
    // Instead of relying on directory listing, we'll look for a predefined or user-added list
    
    // 1. Check if there's a folders.json file that lists available folders
    try {
      const foldersResponse = await fetch(`${basePath}/folders.json`);
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        if (Array.isArray(foldersData.folders)) {
          // Use this predefined list
          return foldersData.folders;
        }
      }
    } catch (err) {
      console.warn("No folders.json found:", err);
    }
    
    // 2. Check for specific folders that we know should exist
    const knownFolders = [
      'Brother_814_Needle_Bar_Mechanism'
    ];
    
    for (const folder of knownFolders) {
      const folderPath = `${basePath}/${folder}`;
      if (await folderExists(folderPath)) {
        dataFolders.push(folder);
      }
    }
    
    // 3. If no folders found yet, check any folder that has a JSON file with a common pattern
    if (dataFolders.length === 0) {
      const fallbackFolders = [];
      
      // If no specific folders are found, scan the data directory for any folder
      // that contains valid JSON files
      try {
        const response = await fetch(`${basePath}/`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('text/html')) {
            const html = await response.text();
            const folderPattern = /href="([^"\.][^"]*?)\/?"/g;
            const matches = [...html.matchAll(folderPattern)];
            
            for (const match of matches) {
              const folderName = match[1].replace(/\/$/, ''); // Remove trailing slash
              if (!folderName.includes('.') && folderName !== '..' && folderName !== '') {
                fallbackFolders.push(folderName);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error scanning data directory:", err);
      }
      
      // Check each potential folder for valid data files
      for (const folder of fallbackFolders) {
        const { hasJson } = await checkFolderContents(folder);
        if (hasJson) {
          dataFolders.push(folder);
        }
      }
    }
    
    return dataFolders;
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
  const cacheKey = `folderContents:${folderName}`;
  if (folderContentsCache[cacheKey]) {
    return folderContentsCache[cacheKey];
  }
  
  try {
    const basePath = getBasePath();
    const folderPath = `${basePath}/${folderName}/`;
    
    // Instead of trying to list files in the directory, which might not be supported,
    // check for common file patterns directly
    
    // Check for common base names
    const commonBaseNames = [
      folderName.includes('_') ? folderName.split('_').pop() : folderName,
      'diagram',
      'data',
      'parts',
      'main'
    ];
    
    for (const baseName of commonBaseNames) {
      if (!baseName) continue;
      
      // Check for JSON file first
      const jsonPath = `${folderPath}${baseName}.json`;
      
      try {
        const jsonResponse = await fetch(jsonPath, { method: 'HEAD' });
        if (jsonResponse.ok) {
          // Found a JSON file, now check for matching CSV and image
          let hasCsv = false;
          let hasImage = false;
          
          try {
            const csvPath = `${folderPath}${baseName}.csv`;
            const csvResponse = await fetch(csvPath, { method: 'HEAD' });
            hasCsv = csvResponse.ok;
          } catch (err) {
            // Ignore CSV check error
          }
          
          // Check for images with different extensions
          for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
            try {
              const imgPath = `${folderPath}${baseName}${ext}`;
              const imgResponse = await fetch(imgPath, { method: 'HEAD' });
              if (imgResponse.ok) {
                hasImage = true;
                break;
              }
            } catch (err) {
              // Continue checking other extensions
            }
          }
          
          const result = { hasJson: true, hasCsv, hasImage, baseName };
          folderContentsCache[cacheKey] = result;
          return result;
        }
      } catch (err) {
        // Try next base name
      }
    }
    
    const result = { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
    folderContentsCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};

/**
 * Clear all caches to force fresh data
 */
export const clearCache = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
  Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key]);
  Object.keys(jsonDataCache).forEach(key => delete jsonDataCache[key]);
  Object.keys(folderExistsCache).forEach(key => delete folderExistsCache[key]);
  Object.keys(folderContentsCache).forEach(key => delete folderContentsCache[key]);
};
