
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
  // Try different common image extensions
  const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const basePath = getBasePath();
  
  // Always try the standard file name first (matching JSON file name)
  for (const ext of extensions) {
    const url = `${basePath}/${folderName}/${fileName}${ext}`;
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
 * Parse CSV file directly using the same filename as the JSON
 */
export const parseCSVFile = async (folderName: string, fileName: string): Promise<TableRow[]> => {
  try {
    const basePath = getBasePath();
    const filePath = `${basePath}/${folderName}/${fileName}.csv`;
    
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
 * Check if a file exists using HEAD request
 */
const fileExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (err) {
    return false;
  }
};

/**
 * Safely parse JSON with additional checks
 */
const safeParseJSON = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error fetching JSON from ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const rawText = await response.text();
    
    if (!rawText || rawText.trim() === '') {
      console.error(`Empty response from ${url}`);
      return null;
    }
    
    // Check if the response is HTML instead of JSON
    if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
      console.error(`Received HTML instead of JSON for ${url}`);
      return null;
    }
    
    try {
      // Parse JSON after ensuring no BOM and properly trimmed
      const jsonData = JSON.parse(rawText.trim().replace(/^\uFEFF/, ''));
      return jsonData;
    } catch (parseError) {
      console.error(`JSON parse error for ${url}:`, parseError);
      return null;
    }
  } catch (err) {
    console.error(`Error processing file at ${url}:`, err);
    return null;
  }
};

/**
 * Load image JSON data using consistent file naming
 */
export const loadImageData = async (folderName: string, fileName: string): Promise<ImageData | null> => {
  try {
    // Create a cache key for this specific JSON file
    const cacheKey = `jsonData:${folderName}/${fileName}`;
    
    // Check if we have this JSON data cached
    if (jsonDataCache[cacheKey]) {
      return jsonDataCache[cacheKey];
    }
    
    const basePath = getBasePath();
    const jsonPath = `${basePath}/${folderName}/${fileName}.json`;
    
    console.log(`Loading JSON data from: ${jsonPath}`);
    let jsonData = await safeParseJSON(jsonPath);
    
    if (jsonData && typeof jsonData === 'object' && 
        typeof jsonData.imageName === 'string' && 
        Array.isArray(jsonData.coordinates)) {
      jsonDataCache[cacheKey] = jsonData;
      return jsonData;
    }
    
    console.error(`No valid JSON data found for folder ${folderName}`);
    return null;
  } catch (err) {
    console.error(`Error processing image data:`, err);
    return null;
  }
};

/**
 * Check folder contents to determine valid file names
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
    
    // First try with the same name as the folder
    const folderBaseName = folderName.includes('/') ? 
      folderName.split('/').pop()! : 
      folderName;
    
    // Replace underscores with nothing in file name
    const fileBaseName = folderBaseName.replace(/_/g, '')
    const jsonPath = `${folderPath}${fileBaseName}.json`;
    
    if (await fileExists(jsonPath)) {
      console.log(`Found JSON file at ${jsonPath}`);
      
      // Check for matching CSV and image files
      let hasCsv = await fileExists(`${folderPath}${fileBaseName}.csv`);
      let hasImage = false;
      
      // Check for images with different extensions
      for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
        if (await fileExists(`${folderPath}${fileBaseName}${ext}`)) {
          hasImage = true;
          break;
        }
      }
      
      const result = { hasJson: true, hasCsv, hasImage, baseName: fileBaseName };
      folderContentsCache[cacheKey] = result;
      return result;
    }
    
    // If that doesn't work, try with the standard name that we've seen before
    const standardBaseName = 'Brother814_Needle_Bar_Mechanism';
    const standardPath = `${folderPath}${standardBaseName}.json`;
    
    if (await fileExists(standardPath)) {
      console.log(`Found standard JSON file at ${standardPath}`);
      
      // Check for matching CSV and image files
      let hasCsv = await fileExists(`${folderPath}${standardBaseName}.csv`);
      let hasImage = false;
      
      // Check for images with different extensions
      for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
        if (await fileExists(`${folderPath}${standardBaseName}${ext}`)) {
          hasImage = true;
          break;
        }
      }
      
      const result = { hasJson: true, hasCsv, hasImage, baseName: standardBaseName };
      folderContentsCache[cacheKey] = result;
      return result;
    }
    
    console.log(`No valid files found in folder ${folderName}`);
    const result = { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
    folderContentsCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};

/**
 * Get available folders from folders.json
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    const basePath = getBasePath();
    
    // Check if there's a folders.json file that lists available folders
    try {
      const foldersResponse = await fetch(`${basePath}/folders.json`);
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        if (Array.isArray(foldersData.folders)) {
          console.log(`Found folders from folders.json:`, foldersData.folders);
          return foldersData.folders;
        }
      }
    } catch (err) {
      console.warn("No folders.json found or error reading it:", err);
    }
    
    // Fallback to hardcoded folders if needed
    return ['Brother_814_Needle_Bar_Mechanism'];
  } catch (err) {
    console.error("Error getting available folders:", err);
    return [];
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
