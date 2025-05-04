
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
 * Gets the appropriate base path for data files based on environment
 */
const getBasePath = (): string => {
  // Always use /data as the base path - works for both dev and production
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
  
  // Try to find the file with the exact same base name as JSON/CSV
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
  
  // Check for known test image file
  const testImagePath = `${basePath}/${folderName}/test_Brother814_Needle_Bar_Mechanism_2.png`;
  try {
    const img = new Image();
    const imagePromise = new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
    
    img.src = testImagePath;
    const exists = await imagePromise;
    
    if (exists) {
      return testImagePath;
    }
  } catch (err) {
    // Continue with fallback
  }
  
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

// Helper function to validate JSON data structure
const isValidImageData = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.imageName === 'string' &&
    Array.isArray(data.coordinates) &&
    data.coordinates.length > 0 &&
    data.coordinates.every((coord: any) => 
      typeof coord === 'object' &&
      typeof coord.id === 'number' &&
      typeof coord.x === 'number' &&
      typeof coord.y === 'number' &&
      typeof coord.number === 'string'
    )
  );
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
      const response = await cachedFetch(jsonPath);
      
      if (!response.ok) {
        console.error(`Failed to load JSON with status ${response.status}`);
        return null;
      }
      
      // Get the raw text first to verify it's not empty or malformed
      const rawText = await response.clone().text();
      
      if (!rawText || rawText.trim() === '') {
        console.error(`Empty JSON response from ${jsonPath}`);
        throw new Error(`Empty JSON response from ${jsonPath}`);
      }
      
      // Try to parse the JSON
      let jsonData;
      try {
        // Use a more controlled way to parse JSON
        jsonData = JSON.parse(rawText);
      } catch (parseError) {
        console.error(`JSON parse error for ${jsonPath}:`, parseError);
        throw new Error(`Failed to parse JSON from ${jsonPath}: ${parseError.message}`);
      }
      
      // Validate the JSON structure
      if (!isValidImageData(jsonData)) {
        console.error(`Invalid JSON data structure in ${jsonPath}`);
        return null;
      }
      
      return jsonData;
    } catch (err) {
      console.error(`Error loading JSON data:`, err);
      return null;
    }
  } catch (err) {
    console.error(`Error processing image data:`, err);
    return null;
  }
};

// Known folder names for the application
const knownFolderPatterns = [
  'Brother_814_Needle_Bar_Mechanism',
  'test2_Brother_814_Needle_Bar_Mechanism', 
  'test3_Brother_814_Needle_Bar_Mechanism',
  'test4_Brother_814_Needle_Bar_Mechanism'
];

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
    
    // Try known base names for this project
    const knownBaseNames = [
      'Brother814_Needle_Bar_Mechanism',
      'diagram',
      'parts',
      'mechanism'
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
      
      // If no direct image match, try the standard test image
      if (!hasImage) {
        try {
          const imgPath = `${basePath}/${folderName}/test_Brother814_Needle_Bar_Mechanism_2.png`;
          
          const img = new Image();
          const imagePromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          
          img.src = imgPath;
          hasImage = await imagePromise;
        } catch (err) {
          // Skip if not found
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
 * Get available folders by checking for the existence of known folder patterns
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    const basePath = getBasePath();
    const foundFolders = new Set<string>();
    const detectedFolders: string[] = [];
    
    // Prioritize these specific folders first that we know have valid data
    const priorityFolders = [
      'Brother_814_Needle_Bar_Mechanism'
    ];
    
    // First check priority folders
    for (const folderName of priorityFolders) {
      try {
        const { hasJson } = await checkFolderContents(folderName);
        
        if (hasJson && !foundFolders.has(folderName)) {
          foundFolders.add(folderName);
          detectedFolders.push(folderName);
        }
      } catch (err) {
        // Continue checking other folders
      }
    }
    
    // If we already found the priority folders, return early to avoid unnecessary checks
    if (detectedFolders.length > 0) {
      return detectedFolders;
    }
    
    // Check for each known folder pattern
    for (const folderName of knownFolderPatterns) {
      try {
        // For each folder, check if it contains a valid JSON file
        const { hasJson } = await checkFolderContents(folderName);
        
        if (hasJson && !foundFolders.has(folderName)) {
          foundFolders.add(folderName);
          detectedFolders.push(folderName);
        }
      } catch (err) {
        // Continue checking other folders
      }
    }
    
    if (detectedFolders.length > 0) {
      return detectedFolders;
    }
    
    // If no folders detected, return the most likely to work
    return ['Brother_814_Needle_Bar_Mechanism'];
  } catch (err) {
    console.error('Error detecting folders:', err);
    return ['Brother_814_Needle_Bar_Mechanism'];
  }
};
