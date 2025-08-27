import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";

// Google Drive configuration
const GOOGLE_DRIVE_FOLDER_ID = "1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77";
const GOOGLE_DRIVE_SHARING_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}?usp=sharing`;

// Cache for API responses
const apiCache: Record<string, any> = {};
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes cache
const cacheTimestamps: Record<string, number> = {};

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface GoogleDriveFolder {
  id: string;
  name: string;
  files: GoogleDriveFile[];
}

/**
 * Cached fetch for API requests
 */
const cachedFetch = async (url: string, options = {}): Promise<Response> => {
  const cacheKey = `api:${url}`;
  
  if (apiCache[cacheKey] && cacheTimestamps[cacheKey] && 
      Date.now() - cacheTimestamps[cacheKey] < CACHE_TIMEOUT) {
    console.log(`Using cached API response for ${url}`);
    return apiCache[cacheKey].clone();
  }
  
  try {
    const response = await fetch(url, options);
    
    if (response.ok) {
      const responseClone = response.clone();
      apiCache[cacheKey] = responseClone;
      cacheTimestamps[cacheKey] = Date.now();
    }
    
    return response;
  } catch (err) {
    console.error(`Error fetching from API ${url}:`, err);
    throw err;
  }
};

/**
 * Try to access a file using different Google Drive URL patterns
 */
const tryAccessFile = async (folderName: string, fileName: string, fileType: string): Promise<string | null> => {
  const baseName = folderName.replace(/\s+/g, '');
  const fullFileName = `${baseName}.${fileType}`;
  
  // Try different URL patterns for accessing Google Drive files
  const urlPatterns = [
    // Direct file access patterns
    `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FOLDER_ID}/${fullFileName}`,
    `https://docs.google.com/uc?export=download&id=${GOOGLE_DRIVE_FOLDER_ID}/${fullFileName}`,
    
    // Folder-based patterns
    `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FOLDER_ID}&file=${fullFileName}`,
    `https://docs.google.com/uc?export=download&id=${GOOGLE_DRIVE_FOLDER_ID}&file=${fullFileName}`,
    
    // Alternative patterns
    `https://drive.google.com/file/d/${GOOGLE_DRIVE_FOLDER_ID}/${fullFileName}/view?usp=sharing`,
    `https://docs.google.com/document/d/${GOOGLE_DRIVE_FOLDER_ID}/${fullFileName}/export?format=${fileType}`,
  ];
  
  for (const url of urlPatterns) {
    try {
      console.log(`Trying to access: ${url}`);
      const response = await cachedFetch(url);
      
      if (response.ok) {
        const content = await response.text();
        
        // Check if we got actual content (not an error page)
        if (content && 
            !content.includes('<!DOCTYPE html>') && 
            !content.includes('Google Drive') &&
            !content.includes('Error') &&
            content.length > 100) {
          console.log(`✅ Successfully accessed ${fullFileName}`);
          return content;
        }
      }
    } catch (err) {
      console.warn(`Failed to access ${url}:`, err);
      continue;
    }
  }
  
  console.warn(`❌ Could not access ${fullFileName} from any URL pattern`);
  return null;
};

/**
 * Get file content from Google Drive using folder and file name
 */
const getFileContent = async (folderName: string, fileName: string, fileType: string): Promise<string | null> => {
  try {
    return await tryAccessFile(folderName, fileName, fileType);
  } catch (err) {
    console.error(`Error downloading file ${fileName} for folder ${folderName}:`, err);
    return null;
  }
};

/**
 * Get image URL from Google Drive using folder and file name
 */
const getImageUrl = (folderName: string, fileName: string): string => {
  const baseName = folderName.replace(/\s+/g, '');
  const fullFileName = `${baseName}.png`;
  
  // Try different image URL patterns
  return `https://drive.google.com/uc?export=view&id=${GOOGLE_DRIVE_FOLDER_ID}&file=${fullFileName}`;
};

/**
 * Discover folders and files from Google Drive using the sharing URL
 */
const discoverGoogleDriveStructure = async (): Promise<GoogleDriveFolder[]> => {
  try {
    console.log('Discovering folder structure from Google Drive API...');
    
    // Use the backend API to dynamically discover folders
    const API_BASE_URL = "http://localhost:3001/api";
    
    try {
      const response = await fetch(`${API_BASE_URL}/folders`);
      
      if (response.ok) {
        const data = await response.json();
        const folders = data.folders || [];
        
        console.log(`✅ Dynamically discovered ${folders.length} folders from Google Drive API`);
        return folders;
      }
    } catch (apiError) {
      console.warn('Backend API not available, falling back to local data...');
    }
    
    // Fallback: Try to discover from the sharing URL or local data
    console.log('Attempting to discover folders from sharing URL...');
    
    // This is a fallback - ideally the backend API should be used
    const fallbackFolders = [
      "Miscellaneous Cover",
      "Miscellaneous Cover and Base Parts", 
      "Miscellaneous Bushing",
      "Thread Eyelet Parts",
      "Looper and Thread Eyelet Parts",
      "Main Driving Shaft Mechanism",
      "Needle Bar Mechanism",
      "Looper Driving Mechanism",
      "Feed Driving Mechanism",
      "Presser Foot Lifter Mechanism",
      "Oil Lubricating System",
      "Thread Stand",
      "Different Parts for Jute Machine",
      "Special Parts for Paper Bag Machine",
      "Single Needle Parts for R-18HS"
    ];
    
    console.log(`⚠️ Using fallback folder list (${fallbackFolders.length} folders) - consider setting up the backend API for dynamic discovery`);
    
    return fallbackFolders.map(folderName => ({
      id: `folder_${folderName.replace(/\s+/g, '_')}`,
      name: folderName,
      files: []
    }));
    
  } catch (err) {
    console.error("Error discovering Google Drive structure:", err);
    throw new Error("Failed to discover Google Drive folder structure. Please ensure the backend server is running or the folder is publicly accessible.");
  }
};

/**
 * Check if a folder has all required files (JSON, CSV, PNG)
 */
export const checkGoogleDriveFolderContents = async (folderName: string): Promise<{
  hasJson: boolean;
  hasCsv: boolean;
  hasImage: boolean;
  baseName: string | null;
  files: { jsonId?: string; csvId?: string; imageId?: string };
}> => {
  try {
    const baseName = folderName.replace(/\s+/g, ''); // Remove spaces for filename
    
    // Try to access each file type
    const [jsonContent, csvContent, imageContent] = await Promise.all([
      tryAccessFile(folderName, baseName, 'json'),
      tryAccessFile(folderName, baseName, 'csv'),
      tryAccessFile(folderName, baseName, 'png')
    ]);
    
    const hasJson = !!jsonContent;
    const hasCsv = !!csvContent;
    const hasImage = !!imageContent;
    
    console.log(`Folder "${folderName}" - JSON: ${hasJson}, CSV: ${hasCsv}, Image: ${hasImage}`);
    
    return {
      hasJson,
      hasCsv,
      hasImage,
      baseName: baseName,
      files: {
        jsonId: hasJson ? 'json' : undefined,
        csvId: hasCsv ? 'csv' : undefined,
        imageId: hasImage ? 'png' : undefined
      }
    };
  } catch (err) {
    console.error(`Error checking Google Drive folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null, files: {} };
  }
};

/**
 * Load image data from Google Drive
 */
export const loadGoogleDriveImageData = async (folderName: string, fileName: string): Promise<ImageData | null> => {
  try {
    const jsonContent = await getFileContent(folderName, fileName, 'json');
    
    if (!jsonContent) {
      console.error(`No JSON file found for ${folderName}`);
      return null;
    }
    
    const jsonData = JSON.parse(jsonContent);
    
    if (jsonData && typeof jsonData === 'object' && 
        typeof jsonData.imageName === 'string' && 
        Array.isArray(jsonData.coordinates)) {
      return jsonData;
    }
    
    console.error(`Invalid JSON data for ${folderName}`);
    return null;
  } catch (err) {
    console.error(`Error loading Google Drive image data for ${folderName}:`, err);
    return null;
  }
};

/**
 * Parse CSV file from Google Drive
 */
export const parseGoogleDriveCSVFile = async (folderName: string, fileName: string): Promise<TableRow[]> => {
  try {
    const csvContent = await getFileContent(folderName, fileName, 'csv');
    
    if (!csvContent) {
      console.error(`No CSV file found for ${folderName}`);
      return [];
    }
    
    const parsedData = parseCSV(csvContent);
    return parsedData;
  } catch (err) {
    console.error(`Error parsing Google Drive CSV file for ${folderName}:`, err);
    return [];
  }
};

/**
 * Get image path from Google Drive
 */
export const getGoogleDriveImagePath = async (folderName: string, fileName: string): Promise<string | null> => {
  try {
    const imageContent = await getFileContent(folderName, fileName, 'png');
    
    if (!imageContent) {
      console.error(`No image file found for ${folderName}`);
      return null;
    }
    
    return getImageUrl(folderName, fileName);
  } catch (err) {
    console.error(`Error getting Google Drive image path for ${folderName}:`, err);
    return null;
  }
};

/**
 * Get available folders from Google Drive
 */
export const getGoogleDriveFolders = async (): Promise<string[]> => {
  try {
    // Get the folder structure
    const folders = await discoverGoogleDriveStructure();
    
    // Filter folders that have all required files
    const validFolders: string[] = [];
    
    for (const folder of folders) {
      const { hasJson, hasCsv, hasImage } = await checkGoogleDriveFolderContents(folder.name);
      
      if (hasJson && hasCsv && hasImage) {
        validFolders.push(folder.name);
        console.log(`✅ Folder "${folder.name}" has all required files`);
      } else {
        console.log(`❌ Folder "${folder.name}" missing required files: JSON=${hasJson}, CSV=${hasCsv}, Image=${hasImage}`);
      }
    }
    
    console.log(`Found ${validFolders.length} valid folders out of ${folders.length} total folders`);
    return validFolders;
  } catch (err) {
    console.error("Error getting Google Drive folders:", err);
    throw err;
  }
};

/**
 * Clear API cache
 */
export const clearGoogleDriveCache = () => {
  Object.keys(apiCache).forEach(key => delete apiCache[key]);
  Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key]);
};
