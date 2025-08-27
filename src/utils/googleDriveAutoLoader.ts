import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";

// API configuration
const API_BASE_URL = "http://localhost:3001/api";

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
 * Get file content from Google Drive using file ID
 */
const getFileContent = async (fileId: string): Promise<string | null> => {
  try {
    console.log(`📥 Fetching file content for ID: ${fileId}`);
    const response = await cachedFetch(`${API_BASE_URL}/file/${fileId}`);
    
    if (!response.ok) {
      console.error(`Failed to download file ${fileId}: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    console.log(`📄 File content length: ${content.length} characters`);
    
    if (content.length === 0) {
      console.error(`File ${fileId} is empty`);
      return null;
    }
    
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
  return `${API_BASE_URL}/file/${fileId}`;
};

/**
 * Discover folders and files from Google Drive using the backend API
 */
const discoverGoogleDriveStructure = async (): Promise<GoogleDriveFolder[]> => {
  try {
    console.log('Fetching folder structure from backend API...');
    
    const response = await cachedFetch(`${API_BASE_URL}/folders`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch folder structure: ${response.status}`);
    }
    
    const data = await response.json();
    const folders = data.folders || [];
    
    console.log(`Discovered ${folders.length} folders from Google Drive`);
    
    return folders;
  } catch (err) {
    console.error("Error discovering Google Drive structure:", err);
    throw new Error("Failed to discover Google Drive folder structure. Please ensure the backend server is running.");
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
    // Get the folder structure to find the specific folder
    const folders = await discoverGoogleDriveStructure();
    
    // Handle both simple folder names and full paths (e.g., "Parent > Child > Grandchild")
    let folder = folders.find(f => f.name.trim() === folderName.trim());
    
    // If not found by exact match, try to find by the last part of the path
    if (!folder) {
      const lastPart = folderName.split('>').pop()?.trim();
      if (lastPart) {
        folder = folders.find(f => f.name.trim().endsWith(lastPart));
      }
    }
    
    if (!folder) {
      console.log(`Folder "${folderName}" not found in Google Drive`);
      return { hasJson: false, hasCsv: false, hasImage: false, baseName: null, files: {} };
    }
    
    // Check for required files - look for any JSON, CSV, and image files in the folder
    // Support multiple image formats: png, jpg, jpeg, webp, gif
    const jsonFile = folder.files.find(f => f.name.toLowerCase().endsWith('.json'));
    const csvFile = folder.files.find(f => f.name.toLowerCase().endsWith('.csv'));
    const imageFile = folder.files.find(f => 
      f.mimeType.startsWith('image/') || 
      f.name.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/)
    );
    
    // Debug: Log what files were found
    console.log(`📁 Folder "${folderName}" files:`, folder.files.map(f => `${f.name} (${f.mimeType})`));
    console.log(`   JSON: ${jsonFile?.name || 'NOT FOUND'}`);
    console.log(`   CSV: ${csvFile?.name || 'NOT FOUND'}`);
    console.log(`   Image: ${imageFile?.name || 'NOT FOUND'}`);
    
    return {
      hasJson: !!jsonFile,
      hasCsv: !!csvFile,
      hasImage: !!imageFile,
      baseName: folderName.trim(), // Use the folder name as base name
      files: {
        jsonId: jsonFile?.id,
        csvId: csvFile?.id,
        imageId: imageFile?.id
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
    
    const jsonContent = await getFileContent(files.jsonId);
    if (!jsonContent) {
      console.error(`Failed to load JSON content for ${folderName}`);
      return null;
    }
    
    const jsonData = JSON.parse(jsonContent);
    console.log(`📋 JSON data for ${folderName}:`, {
      hasImageName: typeof jsonData.imageName === 'string',
      imageName: jsonData.imageName,
      hasCoordinates: Array.isArray(jsonData.coordinates),
      coordinatesLength: jsonData.coordinates?.length
    });
    
    if (jsonData && typeof jsonData === 'object' && 
        typeof jsonData.imageName === 'string' && 
        Array.isArray(jsonData.coordinates)) {
      return jsonData;
    }
    
    console.error(`Invalid JSON data for ${folderName}:`, jsonData);
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
    
    const csvContent = await getFileContent(files.csvId);
    if (!csvContent) {
      console.error(`Failed to load CSV content for ${folderName}`);
      return [];
    }
    
    console.log(`📊 CSV content preview:`, csvContent.substring(0, 200) + '...');
    const parsedData = parseCSV(csvContent);
    console.log(`📊 Parsed CSV data:`, parsedData);
    console.log(`📊 CSV rows count:`, parsedData.length);
    
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
