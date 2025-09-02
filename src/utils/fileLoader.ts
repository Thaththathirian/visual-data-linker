
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
  // Respect Vite base path so assets work under any subpath
  // Vite guarantees BASE_URL ends with a trailing slash
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data`;
};

/**
 * Gets the appropriate table path based on the folder name and file name
 */
export const getTablePath = (folderName: string, fileName: string) => {
  const basePath = getBasePath();
  // Split the folder path and encode each segment separately
  const folderSegments = folderName.split('/').map(segment => encodeURIComponent(segment));
  const encodedFolderPath = folderSegments.join('/');
  return `${basePath}/${encodedFolderPath}/${encodeURIComponent(fileName)}.csv`;
};

/**
 * Gets the appropriate image path with fallback for different extensions
 */
export const getImagePath = async (folderName: string, fileName: string): Promise<string | null> => {
  // Try different common image extensions
  const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  
  // Always try the standard file name first (matching JSON file name)
  const basePath = getBasePath();
  for (const ext of extensions) {
    const filePath = `${folderName}/${fileName}${ext}`;
    const staticUrl = `${basePath}/${filePath}`;
    try {
      const response = await fetch(staticUrl, { method: 'HEAD' });
      if (response.ok) {
        return staticUrl;
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
    // Use static file path instead of API endpoint
    const filePath = `${folderName}/${fileName}.csv`;
    const staticUrl = `${getBasePath()}/${filePath}`;
    
    console.log(`[CSV Loader] Attempting to load CSV from: ${staticUrl}`);
    console.log(`[CSV Loader] Folder: ${folderName}, File: ${fileName}`);
    
    try {
      // Use cached fetch to avoid redundant requests
      const response = await cachedFetch(staticUrl);
      
      console.log(`[CSV Loader] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`[CSV Loader] Failed to load CSV: ${response.status} ${response.statusText}`);
        return [];
      }

      const csvText = await response.text();
      console.log(`[CSV Loader] CSV content length: ${csvText.length} characters`);
      console.log(`[CSV Loader] CSV content preview: ${csvText.substring(0, 200)}...`);
      
      // Check if the response is HTML instead of CSV
      if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
        console.error(`[CSV Loader] Received HTML instead of CSV for ${staticUrl}`);
        return [];
      }
      
      console.log(`[CSV Loader] Parsing CSV content...`);
      const parsedData = parseCSV(csvText);
      console.log(`[CSV Loader] Parsed ${parsedData.length} rows from CSV`);
      console.log(`[CSV Loader] First row sample:`, parsedData[0]);
      
      return parsedData;
    } catch (err) {
      console.error(`[CSV Loader] Error fetching CSV file:`, err);
      return [];
    }
  } catch (err) {
    console.error(`[CSV Loader] Unexpected error in parseCSVFile:`, err);
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
    
    // Use static file path instead of API endpoint
    const filePath = `${folderName}/${fileName}.json`;
    const staticUrl = `${getBasePath()}/${filePath}`;
    
    console.log(`Loading JSON data from: ${staticUrl}`);
    let jsonData = await safeParseJSON(staticUrl);
    
    // If primary file fails, try alternative naming patterns
    if (!jsonData) {
      console.log(`Primary JSON file failed, trying alternative patterns...`);
      
      // Try with -coordinates suffix (actual naming pattern used)
      const coordinatesFileName = `${fileName}-coordinates`;
      const coordinatesFilePath = `${folderName}/${coordinatesFileName}.json`;
      const coordinatesUrl = `${getBasePath()}/${coordinatesFilePath}`;
      
      console.log(`Trying coordinates JSON path: ${coordinatesUrl}`);
      jsonData = await safeParseJSON(coordinatesUrl);
      
      // If still no success, try with underscores removed
      if (!jsonData) {
        const altFileName = fileName.replace(/_/g, '');
        const altFilePath = `${folderName}/${altFileName}.json`;
        const altUrl = `${getBasePath()}/${altFilePath}`;
        
        console.log(`Trying alternative JSON path: ${altUrl}`);
        jsonData = await safeParseJSON(altUrl);
        
        // Try with -coordinates suffix for the underscore-removed version too
        if (!jsonData) {
          const altCoordinatesFileName = `${altFileName}-coordinates`;
          const altCoordinatesFilePath = `${folderName}/${altCoordinatesFileName}.json`;
          const altCoordinatesUrl = `${getBasePath()}/${altCoordinatesFilePath}`;
          
          console.log(`Trying alt coordinates JSON path: ${altCoordinatesUrl}`);
          jsonData = await safeParseJSON(altCoordinatesUrl);
        }
      }
      
      // If still no success, try with the folder name as base
      if (!jsonData) {
        const folderBaseName = folderName.includes('/') ? 
          folderName.split('/').pop()! : 
          folderName;
        const folderFileName = folderBaseName.replace(/_/g, '');
        const folderFilePath = `${folderName}/${folderFileName}.json`;
        const folderUrl = `${getBasePath()}/${folderFilePath}`;
        
        console.log(`Trying folder-based JSON path: ${folderUrl}`);
        jsonData = await safeParseJSON(folderUrl);
        
        // Try with -coordinates suffix for the folder-based version too
        if (!jsonData) {
          const folderCoordinatesFileName = `${folderFileName}-coordinates`;
          const folderCoordinatesFilePath = `${folderName}/${folderCoordinatesFileName}.json`;
          const folderCoordinatesUrl = `${getBasePath()}/${folderCoordinatesFilePath}`;
          
          console.log(`Trying folder coordinates JSON path: ${folderCoordinatesUrl}`);
          jsonData = await safeParseJSON(folderCoordinatesUrl);
        }
      }
    }
    
    if (jsonData && typeof jsonData === 'object' && 
        typeof jsonData.imageName === 'string' && 
        Array.isArray(jsonData.coordinates)) {
      jsonDataCache[cacheKey] = jsonData;
      return jsonData;
    }
    
    // Provide more detailed error information
    if (!jsonData) {
      console.error(`All JSON file attempts failed for folder: ${folderName}`);
      console.error(`Tried paths: ${staticUrl}, ${fileName}-coordinates.json, ${fileName.replace(/_/g, '')}.json, ${fileName.replace(/_/g, '')}-coordinates.json, and folder-based naming with coordinates`);
    } else if (typeof jsonData !== 'object') {
      console.error(`JSON data is not an object: ${typeof jsonData}`);
    } else if (typeof jsonData.imageName !== 'string') {
      console.error(`JSON missing or invalid imageName: ${typeof jsonData.imageName}`);
    } else if (!Array.isArray(jsonData.coordinates)) {
      console.error(`JSON missing or invalid coordinates: ${typeof jsonData.coordinates}`);
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
