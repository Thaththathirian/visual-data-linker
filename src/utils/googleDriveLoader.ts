import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";
import { toast } from "sonner";
import { GOOGLE_DRIVE_CONFIG, getFileMapping, getAvailableFolders } from "@/config/googleDriveConfig";

// Cache for Google Drive responses
const driveCache: Record<string, any> = {};
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes cache
const cacheTimestamps: Record<string, number> = {};

/**
 * Cached fetch for Google Drive API
 */
const cachedFetch = async (url: string, options = {}): Promise<Response> => {
  const cacheKey = `drive:${url}`;
  
  if (driveCache[cacheKey] && cacheTimestamps[cacheKey] && 
      Date.now() - cacheTimestamps[cacheKey] < CACHE_TIMEOUT) {
    console.log(`Using cached Google Drive response for ${url}`);
    return driveCache[cacheKey].clone();
  }
  
  try {
    const response = await fetch(url, options);
    
    if (response.ok) {
      const responseClone = response.clone();
      driveCache[cacheKey] = responseClone;
      cacheTimestamps[cacheKey] = Date.now();
    }
    
    return response;
  } catch (err) {
    console.error(`Error fetching from Google Drive ${url}:`, err);
    throw err;
  }
};

/**
 * Get file content from Google Drive using file ID
 * For now, this returns mock data since we don't have actual file IDs
 */
const getFileContent = async (fileId: string, fileType: 'json' | 'csv'): Promise<string | null> => {
  try {
    // Check if we have a real file ID (not placeholder)
    if (fileId === 'YOUR_JSON_FILE_ID_HERE' || fileId === 'YOUR_CSV_FILE_ID_HERE') {
      console.warn(`Using mock data for ${fileType} file - please update file IDs in config`);
      
      // Return mock data
      if (fileType === 'json') {
        return JSON.stringify({
          imageName: "Mock Image",
          coordinates: [
            { x: 100, y: 100, partId: "part1", label: "Part 1" },
            { x: 200, y: 150, partId: "part2", label: "Part 2" }
          ]
        });
      } else if (fileType === 'csv') {
        return `Part ID,Name,Description,Category
part1,Part 1,Description for part 1,Category A
part2,Part 2,Description for part 2,Category B`;
      }
    }
    
    // For real file IDs, use Google Drive download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await cachedFetch(downloadUrl);
    
    if (!response.ok) {
      console.error(`Failed to download file ${fileId}: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    return content;
  } catch (err) {
    console.error(`Error downloading file ${fileId}:`, err);
    return null;
  }
};

/**
 * Get image URL from Google Drive file ID
 */
const getImageUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
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
    // Check if the folder exists in our configuration
    const folderData = getFileMapping(folderName);
    
    if (!folderData) {
      console.log(`Folder "${folderName}" not found in Google Drive configuration`);
      return { hasJson: false, hasCsv: false, hasImage: false, baseName: null, files: {} };
    }
    
    const baseName = folderName.replace(/\s+/g, ''); // Remove spaces for filename
    
    return {
      hasJson: !!folderData.jsonId,
      hasCsv: !!folderData.csvId,
      hasImage: !!folderData.imageId,
      baseName: baseName,
      files: {
        jsonId: folderData.jsonId,
        csvId: folderData.csvId,
        imageId: folderData.imageId
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
    const { files } = await checkGoogleDriveFolderContents(folderName);
    
    if (!files.jsonId) {
      console.error(`No JSON file found for ${folderName}`);
      return null;
    }
    
    const jsonContent = await getFileContent(files.jsonId, 'json');
    if (!jsonContent) {
      console.error(`Failed to load JSON content for ${folderName}`);
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
    const { files } = await checkGoogleDriveFolderContents(folderName);
    
    if (!files.csvId) {
      console.error(`No CSV file found for ${folderName}`);
      return [];
    }
    
    const csvContent = await getFileContent(files.csvId, 'csv');
    if (!csvContent) {
      console.error(`Failed to load CSV content for ${folderName}`);
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
    const { files } = await checkGoogleDriveFolderContents(folderName);
    
    if (!files.imageId) {
      console.error(`No image file found for ${folderName}`);
      return null;
    }
    
    return getImageUrl(files.imageId);
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
    // Return the folder names from our configuration
    return getAvailableFolders();
  } catch (err) {
    console.error("Error getting Google Drive folders:", err);
    return [];
  }
};

/**
 * Clear Google Drive cache
 */
export const clearGoogleDriveCache = () => {
  Object.keys(driveCache).forEach(key => delete driveCache[key]);
  Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key]);
};
