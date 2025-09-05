
import { TableRow, ImageData } from "@/types";
import { toast } from "sonner";

// Remove static Google Drive imports; we'll import on demand inside functions

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
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data`;
};

/**
 * Gets the appropriate table path based on the folder name and file name
 */
export const getTablePath = (folderName: string, fileName: string) => {
  const basePath = getBasePath();
  const folderSegments = folderName.split('/').map(segment => encodeURIComponent(segment));
  const encodedFolderPath = folderSegments.join('/');
  return `${basePath}/${encodedFolderPath}/${encodeURIComponent(fileName)}.csv`;
};

/**
 * Gets the appropriate image path with fallback for different extensions
 * Now supports automatic file detection in Google Drive folders with exact name matching
 */
export const getImagePath = async (relativeProduct: string, fileName?: string): Promise<string | null> => {
  console.log("[Drive] getImagePath using Google Drive for", { relativeProduct, fileName });
  const { findFolderByExactName, findImageFileInFolder, listFilesInFolder } = await import('@/utils/googleDrive');
  const normalizedProductName = relativeProduct.replace(/\s+/g, ' ').trim();
  
  // Use exact folder name matching to find the folder anywhere in Google Drive
  const folder = await findFolderByExactName(normalizedProductName);
  if (!folder) {
    console.warn(`[Drive] Folder not found: "${normalizedProductName}"`);
    return null;
  }
  
  // If fileName is provided, try to find that specific file
  if (fileName) {
    const url = await findImageFileInFolder(folder.id, fileName);
    if (url) return url;
  }
  
  // Auto-detect image files in the folder
  const files = await listFilesInFolder(folder.id);
  const imageFiles = files.filter(file => 
    /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name)
  );
  
  if (imageFiles.length > 0) {
    // Prefer thumbnail.png, then any other image
    const thumbnail = imageFiles.find(f => f.name.toLowerCase() === 'thumbnail.png');
    if (thumbnail) {
      const { getDriveDownloadUrl } = await import('@/utils/googleDrive');
      return getDriveDownloadUrl(thumbnail.id);
    }
    
    // Use the first available image
    const { getDriveDownloadUrl } = await import('@/utils/googleDrive');
    return getDriveDownloadUrl(imageFiles[0].id);
  }
  
  return null;
};

/**
 * Parse CSV file directly using the same filename as the JSON
 * Now supports automatic CSV file detection in Google Drive folders with exact name matching
 */
export const parseCSVFile = async (relativeProduct: string, fileName?: string): Promise<TableRow[]> => {
  try {
    console.log("[Drive] parseCSVFile using Google Drive for", { relativeProduct, fileName });
    const { findFolderByExactName, fetchCsvRowsInFolder, listFilesInFolder } = await import('@/utils/googleDrive');
    const { parseCSV } = await import('@/utils/csvParser');
    const normalizedProductName = relativeProduct.replace(/\s+/g, ' ').trim();
    
    // Use exact folder name matching to find the folder anywhere in Google Drive
    const folder = await findFolderByExactName(normalizedProductName);
    if (!folder) {
      console.warn(`[Drive] Folder not found: "${normalizedProductName}"`);
      return [];
    }
    
    // If fileName is provided, try to fetch that specific CSV
    if (fileName) {
      const csvText = await fetchCsvRowsInFolder(folder.id, fileName);
      if (csvText) return await parseCSV(csvText);
    }
    
    // Auto-detect CSV files in the folder
    const files = await listFilesInFolder(folder.id);
    const csvFiles = files.filter(file => 
      /\.csv$/i.test(file.name)
    );
    
    if (csvFiles.length > 0) {
      // Prefer data.csv, then any other CSV file
      const dataCsv = csvFiles.find(f => f.name.toLowerCase() === 'data.csv');
      const targetFile = dataCsv || csvFiles[0];
      
      // Extract base name without extension for fetchCsvRowsInFolder
      const baseName = targetFile.name.replace(/\.csv$/i, '');
      const csvText = await fetchCsvRowsInFolder(folder.id, baseName);
      if (csvText) return await parseCSV(csvText);
    }
    
    return [];
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
 * Now supports automatic JSON file detection in Google Drive folders with exact name matching
 */
export const loadImageData = async (relativeProduct: string, fileName?: string): Promise<ImageData | null> => {
  try {
    const { findFolderByExactName, fetchJsonInFolderByCandidates, listFilesInFolder } = await import('@/utils/googleDrive');
    // Create a cache key for this specific JSON file
    const cacheKey = `jsonData:${relativeProduct}/${fileName || 'auto'}`;
    
    // Check if we have this JSON data cached
    if (jsonDataCache[cacheKey]) {
      return jsonDataCache[cacheKey];
    }
    
    console.log("[Drive] loadImageData using Google Drive for", { relativeProduct, fileName });
    const normalizedProductName = relativeProduct.replace(/\s+/g, ' ').trim();
    
    // Use exact folder name matching to find the folder anywhere in Google Drive
    const folder = await findFolderByExactName(normalizedProductName);
    if (!folder) {
      console.warn(`[Drive] Folder not found: "${normalizedProductName}"`);
      return null;
    }
    
    // If fileName is provided, try specific candidates first
    if (fileName) {
      const candidateNames: string[] = [
        fileName,
        `${fileName}-coordinates`,
        fileName.replace(/_/g, ''),
        `${fileName.replace(/_/g, '')}-coordinates`,
      ];
      // Also try folder-based name
      const folderBaseName = relativeProduct.includes('/') ? relativeProduct.split('/').pop()! : relativeProduct;
      const folderFileBase = folderBaseName.replace(/_/g, '');
      candidateNames.push(folderFileBase, `${folderFileBase}-coordinates`);

      const jsonData = await fetchJsonInFolderByCandidates(folder.id, candidateNames);
      if (jsonData && typeof jsonData === 'object' && typeof jsonData.imageName === 'string' && Array.isArray(jsonData.coordinates)) {
        jsonDataCache[cacheKey] = jsonData;
        return jsonData;
      }
    }
    
    // Auto-detect JSON files in the folder
    const files = await listFilesInFolder(folder.id);
    const jsonFiles = files.filter(file => 
      /\.json$/i.test(file.name)
    );
    
    if (jsonFiles.length > 0) {
      // Prefer coordinates.json, then any other JSON file
      const coordinatesJson = jsonFiles.find(f => f.name.toLowerCase() === 'coordinates.json');
      const targetFile = coordinatesJson || jsonFiles[0];
      
      // Extract base name without extension for fetchJsonInFolderByCandidates
      const baseName = targetFile.name.replace(/\.json$/i, '');
      const jsonData = await fetchJsonInFolderByCandidates(folder.id, [baseName]);
      if (jsonData && typeof jsonData === 'object' && typeof jsonData.imageName === 'string' && Array.isArray(jsonData.coordinates)) {
        jsonDataCache[cacheKey] = jsonData;
        return jsonData;
      }
    }
    
    return null;
  } catch (err) {
    console.error(`Error processing image data:`, err);
    return null;
  }
};

/**
 * Check folder contents to determine valid file names
 * Now supports exact folder name matching anywhere in Google Drive
 */
export const checkFolderContents = async (relativeProduct: string): Promise<{
  hasJson: boolean;
  hasCsv: boolean;
  hasImage: boolean;
  baseName: string | null;
}> => {
  const { findFolderByExactName, listFilesInFolder, findImageFileInFolder } = await import('@/utils/googleDrive');
  const { fetchCsvRowsInFolder } = await import('@/utils/googleDrive');
  const cacheKey = `folderContents:${relativeProduct}`;
  if (folderContentsCache[cacheKey]) {
    return folderContentsCache[cacheKey];
  }
  
  try {
    console.log("[Drive] checkFolderContents using Google Drive for", { relativeProduct });
    const normalizedProductName = relativeProduct.replace(/\s+/g, ' ').trim();
    
    // Use exact folder name matching to find the folder anywhere in Google Drive
    const folder = await findFolderByExactName(normalizedProductName);
    if (!folder) {
      console.warn(`[Drive] Folder not found: "${normalizedProductName}"`);
      const result = { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
      folderContentsCache[cacheKey] = result;
      return result;
    }
    const folderBaseName = relativeProduct.includes('/') ? relativeProduct.split('/').pop()! : relativeProduct;
    const fileBaseName = folderBaseName.replace(/_/g, '');

    // Check for JSON using same candidates as loadImageData
    const candidateNames: string[] = [
      fileBaseName,
      `${fileBaseName}-coordinates`,
      folderBaseName,
      `${folderBaseName}-coordinates`,
    ];
    let json = await (await import('@/utils/googleDrive')).fetchJsonInFolderByCandidates(folder.id, candidateNames);
    let detectedBase = json ? fileBaseName : null;

    // Fallback: scan for any *.json in folder and use its base name
    if (!json) {
      const files = await listFilesInFolder(folder.id);
      const anyJson = files.find(f => f.name.toLowerCase().endsWith('.json'));
      if (anyJson) {
        detectedBase = anyJson.name.replace(/\.json$/i, '').replace(/-coordinates$/i, '');
        json = await (await import('@/utils/googleDrive')).fetchJsonInFolderByCandidates(folder.id, [detectedBase!, `${detectedBase}-coordinates`]);
      }
    }

    const hasJson = !!json;

    // CSV
    const csvText = detectedBase ? await fetchCsvRowsInFolder(folder.id, detectedBase) : '';
    const hasCsv = !!csvText;

    // Image
    const imageUrl = detectedBase ? await findImageFileInFolder(folder.id, detectedBase) : null;
    const hasImage = !!imageUrl;

    const result = { hasJson, hasCsv, hasImage, baseName: detectedBase };
    folderContentsCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.error(`Error checking folder contents for ${relativeProduct}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};

/**
 * Get available folders from folders.json
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    const { isDriveEnabled, getRootFolderId, listAllSubfoldersRecursive } = await import('@/utils/googleDrive');
    if (!isDriveEnabled()) {
      console.warn("[Drive] is disabled or misconfigured. No local data fallback. Configure VITE_USE_GOOGLE_DRIVE and credentials.");
      return [];
    }
    console.log("[Drive] getAvailableFolders using Google Drive");
    const rootId = getRootFolderId();
    if (!rootId) return [];
    const all = await listAllSubfoldersRecursive(rootId);
    return all;
  } catch (err) {
    console.error("Error getting available folders:", err);
    return [];
  }
};

/**
 * Get all files (PNG, CSV, JSON) from a folder by exact name
 * This function finds the folder anywhere in Google Drive and returns all relevant files
 */
export const getAllFilesFromFolder = async (relativeProduct: string): Promise<{
  folder: any;
  images: any[];
  csvFiles: any[];
  jsonFiles: any[];
  allFiles: any[];
}> => {
  try {
    console.log("[Drive] Getting all files from folder:", relativeProduct);
    const { findFolderByExactName, listFilesInFolder, getDriveDownloadUrl } = await import('@/utils/googleDrive');
    
    // Find the folder by exact name anywhere in Google Drive
    const folder = await findFolderByExactName(relativeProduct);
    if (!folder) {
      console.warn(`[Drive] Folder not found: "${relativeProduct}"`);
      return {
        folder: null,
        images: [],
        csvFiles: [],
        jsonFiles: [],
        allFiles: []
      };
    }
    
    // Get all files in the folder
    const allFiles = await listFilesInFolder(folder.id);
    
    // Categorize files by type
    const images = allFiles.filter(file => 
      /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name)
    ).map(file => ({
      ...file,
      downloadUrl: getDriveDownloadUrl(file.id),
      type: 'image'
    }));
    
    const csvFiles = allFiles.filter(file => 
      /\.csv$/i.test(file.name)
    ).map(file => ({
      ...file,
      downloadUrl: getDriveDownloadUrl(file.id),
      type: 'csv'
    }));
    
    const jsonFiles = allFiles.filter(file => 
      /\.json$/i.test(file.name)
    ).map(file => ({
      ...file,
      downloadUrl: getDriveDownloadUrl(file.id),
      type: 'json'
    }));
    
    console.log(`[Drive] Found in folder "${relativeProduct}":`, {
      totalFiles: allFiles.length,
      images: images.length,
      csvFiles: csvFiles.length,
      jsonFiles: jsonFiles.length
    });
    
    return {
      folder,
      images,
      csvFiles,
      jsonFiles,
      allFiles: allFiles.map(file => ({
        ...file,
        downloadUrl: getDriveDownloadUrl(file.id),
        type: /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name) ? 'image' :
              /\.csv$/i.test(file.name) ? 'csv' :
              /\.json$/i.test(file.name) ? 'json' : 'other'
      }))
    };
  } catch (error) {
    console.error(`[Drive] Error getting files from folder "${relativeProduct}":`, error);
    return {
      folder: null,
      images: [],
      csvFiles: [],
      jsonFiles: [],
      allFiles: []
    };
  }
};

/**
 * Get product thumbnail image URL from Google Drive
 * This function finds the folder by product_path and returns the best available image
 */
export const getProductThumbnail = async (productPath: string): Promise<string | null> => {
  try {
    console.log("[Drive] Getting product thumbnail for:", productPath);
    const { findFolderByExactName, listFilesInFolder, getDriveDownloadUrl } = await import('@/utils/googleDrive');
    
    // Find the folder by exact name anywhere in Google Drive
    const folder = await findFolderByExactName(productPath);
    if (!folder) {
      console.warn(`[Drive] Folder not found for thumbnail: "${productPath}"`);
      return null;
    }
    
    // Get all files in the folder
    const files = await listFilesInFolder(folder.id);
    const imageFiles = files.filter(file => 
      /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name)
    );
    
    if (imageFiles.length > 0) {
      // Prefer thumbnail.png, then any other image
      const thumbnail = imageFiles.find(f => f.name.toLowerCase() === 'thumbnail.png');
      if (thumbnail) {
        return getDriveDownloadUrl(thumbnail.id);
      }
      
      // Use the first available image
      return getDriveDownloadUrl(imageFiles[0].id);
    }
    
    return null;
  } catch (error) {
    console.error(`[Drive] Error getting thumbnail for "${productPath}":`, error);
    return null;
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
