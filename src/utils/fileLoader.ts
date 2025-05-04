
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
    // Use a regular fetch to avoid caching issues specifically for JSON
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error fetching JSON from ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    // Get the content type to check if it's actually JSON
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      console.error(`Received non-JSON content type (${contentType}) for ${url}`);
      // We'll still try to parse it, but log the warning
    }
    
    const rawText = await response.text();
    
    if (!rawText || rawText.trim() === '') {
      console.error(`Empty response from ${url}`);
      return null;
    }
    
    // Check if the response is HTML instead of JSON
    if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
      console.error(`Received HTML instead of JSON for ${url}`);
      
      // Instead of failing, let's try to find a different file with the correct JSON
      return null;
    }
    
    // Try to parse the JSON
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
 * Load image JSON data dynamically from a specified folder
 * Now with improved file name handling
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
    
    // Try with the direct specified file first
    const directJsonPath = `${basePath}/${folderName}/${baseName}.json`;
    console.log(`Attempting to load JSON from: ${directJsonPath}`);
    
    // Try loading the JSON with the direct path
    let jsonData = await safeParseJSON(directJsonPath);
    
    if (jsonData && typeof jsonData === 'object' && 
        typeof jsonData.imageName === 'string' && 
        Array.isArray(jsonData.coordinates)) {
      // Store in cache before returning
      jsonDataCache[cacheKey] = jsonData;
      return jsonData;
    }
    
    // If using the same name as the folder didn't work, try with Brother814_Needle_Bar_Mechanism.json
    const standardFileName = 'Brother814_Needle_Bar_Mechanism.json';
    const standardPath = `${basePath}/${folderName}/${standardFileName}`;
    
    if (directJsonPath !== standardPath) {
      console.log(`Direct path failed, trying standard file name: ${standardPath}`);
      jsonData = await safeParseJSON(standardPath);
      
      if (jsonData && typeof jsonData === 'object' && 
          typeof jsonData.imageName === 'string' && 
          Array.isArray(jsonData.coordinates)) {
        // Store in cache before returning
        jsonDataCache[cacheKey] = jsonData;
        return jsonData;
      }
    }
    
    console.error(`No valid JSON data found for folder ${folderName}`);
    return null;
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
    
    // 1. Check if there's a folders.json file that lists available folders
    try {
      const foldersResponse = await fetch(`${basePath}/folders.json`);
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        if (Array.isArray(foldersData.folders)) {
          console.log(`Found folders from folders.json:`, foldersData.folders);
          
          // Verify that these folders actually have related files
          const verifiedFolders: string[] = [];
          for (const folder of foldersData.folders) {
            const folderCheck = await checkFolderContents(folder);
            if (folderCheck.hasJson || folderCheck.hasImage) {
              verifiedFolders.push(folder);
            } else {
              console.warn(`Folder ${folder} listed in folders.json does not contain required files`);
            }
          }
          
          return verifiedFolders.length > 0 ? verifiedFolders : foldersData.folders;
        }
      }
    } catch (err) {
      console.warn("No folders.json found or error reading it:", err);
    }
    
    // 2. If folders.json doesn't work, use the hardcoded list as fallback
    const knownFolders = [
      'Brother_814_Needle_Bar_Mechanism',
      'test2_Brother_814_Needle_Bar_Mechanism',
      'test3_Brother_814_Needle_Bar_Mechanism',
      'test4_Brother_814_Needle_Bar_Mechanism',
      'test5_Brother_814_Needle_Bar_Mechanism'
    ];
    
    const dataFolders: string[] = [];
    
    for (const folder of knownFolders) {
      // Instead of checking if folder exists (which might fail in some environments),
      // check if it has any of the required files
      const folderCheck = await checkFolderContents(folder);
      if (folderCheck.hasJson || folderCheck.hasImage) {
        dataFolders.push(folder);
      }
    }
    
    console.log(`Found folders from known list:`, dataFolders);
    
    return dataFolders;
  } catch (err) {
    console.error("Error getting available folders:", err);
    return [];
  }
};

/**
 * Check if a folder has the required files (JSON, image)
 * With improved file name handling
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
    
    // First try with the standard file name that we know
    const standardBaseName = 'Brother814_Needle_Bar_Mechanism';
    const standardJsonPath = `${folderPath}${standardBaseName}.json`;
    
    if (await fileExists(standardJsonPath)) {
      console.log(`Found standard JSON file at ${standardJsonPath}`);
      
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
    
    // If standard name didn't work, try with the folder name itself
    const folderBaseName = folderName.includes('/') ? 
      folderName.split('/').pop()! : 
      folderName;
    
    const folderJsonPath = `${folderPath}${folderBaseName}.json`;
    
    if (await fileExists(folderJsonPath)) {
      console.log(`Found folder-named JSON file at ${folderJsonPath}`);
      
      // Check for matching CSV and image files
      let hasCsv = await fileExists(`${folderPath}${folderBaseName}.csv`);
      let hasImage = false;
      
      // Check for images with different extensions
      for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
        if (await fileExists(`${folderPath}${folderBaseName}${ext}`)) {
          hasImage = true;
          break;
        }
      }
      
      const result = { hasJson: true, hasCsv, hasImage, baseName: folderBaseName };
      folderContentsCache[cacheKey] = result;
      return result;
    }
    
    // Try some other common base names
    const possibleBaseNames = [
      // Try to extract the name part after an underscore
      folderName.includes('_') ? folderName.split('_').pop()! : null,
      // Generic names to try
      'diagram',
      'data',
      'parts',
      'main',
      'Mechanism'
    ].filter(Boolean); // Remove null values
    
    console.log(`Checking folder ${folderName} with possible base names:`, possibleBaseNames);
    
    for (const baseName of possibleBaseNames) {
      if (!baseName) continue;
      
      // Check for JSON file
      const jsonPath = `${folderPath}${baseName}.json`;
      
      if (await fileExists(jsonPath)) {
        console.log(`Found JSON file at ${jsonPath}`);
        // Found a JSON file, now check for matching CSV and image
        let hasCsv = await fileExists(`${folderPath}${baseName}.csv`);
        let hasImage = false;
        
        // Check for images with different extensions
        for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
          if (await fileExists(`${folderPath}${baseName}${ext}`)) {
            hasImage = true;
            break;
          }
        }
        
        const result = { hasJson: true, hasCsv, hasImage, baseName };
        folderContentsCache[cacheKey] = result;
        return result;
      }
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
 * Clear all caches to force fresh data
 */
export const clearCache = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
  Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key]);
  Object.keys(jsonDataCache).forEach(key => delete jsonDataCache[key]);
  Object.keys(folderExistsCache).forEach(key => delete folderExistsCache[key]);
  Object.keys(folderContentsCache).forEach(key => delete folderContentsCache[key]);
};
