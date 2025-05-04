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
const cachedFetch = async (url: string, options = {}, bypassCache = false): Promise<Response> => {
  const cacheKey = `fetch:${url}`;
  
  // Check if we have a cached response that's still valid
  if (!bypassCache && cache[cacheKey] && cacheTimestamps[cacheKey] && 
      Date.now() - cacheTimestamps[cacheKey] < CACHE_TIMEOUT) {
    console.log(`Using cached response for ${url}`);
    return cache[cacheKey];
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
      const img = new Image();
      const imagePromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      
      img.src = url;
      const exists = await imagePromise;
      
      if (exists) {
        return url;
      }
    } catch (err) {
      // Continue trying other extensions
    }
  }
  
  return null; // Return null instead of fallback to avoid showing fallback images
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
        throw new Error(`Failed to load CSV file`);
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
    // Strip any extension if present
    const baseName = fileName.includes('.') ? 
      fileName.substring(0, fileName.lastIndexOf('.')) : 
      fileName;
    
    const basePath = getBasePath();
    const jsonPath = `${basePath}/${folderName}/${baseName}.json`;
    
    try {
      // Use cached fetch to avoid redundant requests
      const response = await cachedFetch(jsonPath, {}, true);
      
      if (!response.ok) {
        console.error(`Failed to load JSON with status ${response.status}`);
        throw new Error(`Failed to load JSON with status ${response.status}`);
      }
      
      // Get the raw text first to verify it's not empty or malformed
      const rawText = await response.text();
      
      if (!rawText || rawText.trim() === '') {
        console.error(`Empty JSON response from ${jsonPath}`);
        throw new Error(`Empty JSON response from ${jsonPath}`);
      }
      
      // Try to parse the JSON
      try {
        // Parse JSON after ensuring no BOM and properly trimmed
        const jsonData = JSON.parse(rawText.trim().replace(/^\uFEFF/, ''));
        
        // Return the data if it's valid
        if (jsonData && typeof jsonData === 'object' && 
            typeof jsonData.imageName === 'string' && 
            Array.isArray(jsonData.coordinates)) {
          return jsonData;
        } else {
          console.error(`Invalid JSON data structure in ${jsonPath}`);
          return null;
        }
      } catch (parseError) {
        console.error(`JSON parse error for ${jsonPath}:`, parseError);
        throw new Error(`Failed to parse JSON from ${jsonPath}: ${parseError.message}`);
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
    
    // Attempt to fetch the directory listing
    try {
      const response = await fetch(`${basePath}/`);
      
      if (!response.ok) {
        console.warn("Directory listing not supported - using manual folder checking");
        // Fall back to checking known folder patterns
        return scanForValidFolders();
      }
      
      // Try to parse as HTML to extract directory listings (works on some servers)
      const html = await response.text();
      const folderPattern = /href="([^"]+)\/?"/g;
      const matches = [...html.matchAll(folderPattern)];
      
      const potentialFolders = matches
        .map(match => match[1].replace(/\/$/, '')) // Remove trailing slash
        .filter(folder => !folder.includes('.') && folder !== '..' && folder !== ''); // Filter out files and navigation
      
      if (potentialFolders.length > 0) {
        // Verify folders by checking for JSON files
        const validFolders = [];
        
        for (const folder of potentialFolders) {
          const { hasJson } = await checkFolderContents(folder);
          if (hasJson) {
            validFolders.push(folder);
          }
        }
        
        return validFolders;
      }
    } catch (err) {
      console.warn("Error fetching directory listing:", err);
    }
    
    // Fallback to manual folder scanning
    return scanForValidFolders();
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
    
    let baseName = null;
    let hasJson = false;
    let hasCsv = false;
    let hasImage = false;
    
    // First, try to fetch the directory listing
    try {
      const response = await cachedFetch(`${basePath}/${folderName}/`, {}, true);
      
      if (response.ok) {
        // Try to parse as HTML to extract files
        const html = await response.text();
        const filePattern = /href="([^"]+)"/g;
        const matches = [...html.matchAll(filePattern)];
        
        const files = matches
          .map(match => match[1])
          .filter(file => file.includes('.') && !file.includes('..'));
        
        // Look for .json files
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        if (jsonFiles.length > 0) {
          const jsonFile = jsonFiles[0];
          baseName = jsonFile.substring(0, jsonFile.lastIndexOf('.'));
          hasJson = true;
          
          // Check if matching CSV exists
          hasCsv = files.some(file => file === `${baseName}.csv`);
          
          // Check if matching image exists
          hasImage = files.some(file => 
            ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(ext => 
              file === `${baseName}${ext}`
            )
          );
          
          return { hasJson, hasCsv, hasImage, baseName };
        }
      }
    } catch (err) {
      // Fall back to manual checking
    }
    
    // Try known base names for this project
    const knownBaseNames = [
      'Brother814_Needle_Bar_Mechanism',
      'diagram',
      'parts',
      'mechanism',
      'data'
    ];
    
    // Check for JSON file with a known basename
    for (const bName of knownBaseNames) {
      try {
        const jsonPath = `${basePath}/${folderName}/${bName}.json`;
        // Use HEAD request to check if file exists without downloading the content
        const jsonResponse = await cachedFetch(jsonPath, { method: 'HEAD' });
        
        if (jsonResponse.ok) {
          hasJson = true;
          baseName = bName;
          console.log(`Found JSON file: ${bName}.json in folder ${folderName}`);
          break; // Stop once we find a valid JSON
        }
      } catch (err) {
        // Continue checking other base names
      }
    }
    
    // If we found a valid baseName, check for matching CSV and images
    if (baseName) {
      try {
        const csvPath = `${basePath}/${folderName}/${baseName}.csv`;
        const csvResponse = await cachedFetch(csvPath, { method: 'HEAD' });
        hasCsv = csvResponse.ok;
      } catch (err) {
        // Continue to image check
      }
      
      // Check for a matching image with common extensions
      const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
      for (const ext of imageExts) {
        try {
          const imgPath = `${basePath}/${folderName}/${baseName}${ext}`;
          
          const img = new Image();
          const imagePromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          
          img.src = imgPath;
          hasImage = await imagePromise;
          
          if (hasImage) {
            break;
          }
        } catch (err) {
          // Continue trying other extensions
        }
      }
    }
    
    return { hasJson, hasCsv, hasImage, baseName };
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};

/**
 * Scan for folders containing valid data
 */
const scanForValidFolders = async (): Promise<string[]> => {
  // Pattern for Brother mechanism folders and any folders that have 'mechanism' in the name
  const folderPatterns = [
    // Specific folders we know exist
    'Brother_814_Needle_Bar_Mechanism',
    'test2_Brother_814_Needle_Bar_Mechanism',
    'test3_Brother_814_Needle_Bar_Mechanism',
    'test4_Brother_814_Needle_Bar_Mechanism',
    // Generic pattern for trying other folders
    'mechanism'
  ];
  
  const detectedFolders: string[] = [];
  const basePath = getBasePath();
  
  for (const pattern of folderPatterns) {
    try {
      const folderPath = pattern.includes('_') ? pattern : `*${pattern}*`;
      const checkPath = `${basePath}/${folderPath}/`;
      
      // Try a HEAD request to check if the folder exists
      const exists = await fetch(checkPath)
        .then(res => res.status !== 404)
        .catch(() => false);
      
      if (exists) {
        const { hasJson, baseName } = await checkFolderContents(folderPath);
        if (hasJson && baseName) {
          detectedFolders.push(folderPath);
        }
      }
    } catch (err) {
      console.warn(`Error checking ${pattern} folder:`, err);
    }
  }
  
  // If no folders found, check for individual folders directly
  if (detectedFolders.length === 0) {
    // Try a direct list of folders to check
    const specificFolders = [
      'Brother_814_Needle_Bar_Mechanism',
      'test2_Brother_814_Needle_Bar_Mechanism',
      'test3_Brother_814_Needle_Bar_Mechanism',
      'test4_Brother_814_Needle_Bar_Mechanism'
    ];
    
    for (const folder of specificFolders) {
      const { hasJson } = await checkFolderContents(folder);
      if (hasJson) {
        detectedFolders.push(folder);
      }
    }
  }
  
  return detectedFolders;
};