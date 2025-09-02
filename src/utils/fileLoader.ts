
import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";
import { toast } from "sonner";
import {
  isDriveEnabled,
  getRootFolderId,
  resolveFolderByNameUnderRoot,
  resolveFolderByPath,
  fetchJsonInFolderByCandidates,
  fetchCsvRowsInFolder,
  findImageFileInFolder,
  listSubfolders,
  listAllSubfoldersRecursive,
  listFilesInFolder,
} from "@/utils/googleDrive";

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
  console.log("[Drive] getImagePath using Google Drive for", { folderName, fileName });
  const normalizedFolderName = folderName.replace(/\s+/g, ' ').trim();
  const folder = normalizedFolderName.includes('/')
    ? await resolveFolderByPath(normalizedFolderName)
    : await resolveFolderByNameUnderRoot(normalizedFolderName);
  if (!folder) return null;
  const url = await findImageFileInFolder(folder.id, fileName);
  return url;
};

/**
 * Parse CSV file directly using the same filename as the JSON
 */
export const parseCSVFile = async (folderName: string, fileName: string): Promise<TableRow[]> => {
  try {
    console.log("[Drive] parseCSVFile using Google Drive for", { folderName, fileName });
    const normalizedFolderName = folderName.replace(/\s+/g, ' ').trim();
    const folder = normalizedFolderName.includes('/')
      ? await resolveFolderByPath(normalizedFolderName)
      : await resolveFolderByNameUnderRoot(normalizedFolderName);
    if (!folder) return [];
    const csvText = await fetchCsvRowsInFolder(folder.id, fileName);
    if (!csvText) return [];
    return parseCSV(csvText);
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
    
    console.log("[Drive] loadImageData using Google Drive for", { folderName, fileName });
    const normalizedFolderName = folderName.replace(/\s+/g, ' ').trim();
    const folder = normalizedFolderName.includes('/')
      ? await resolveFolderByPath(normalizedFolderName)
      : await resolveFolderByNameUnderRoot(normalizedFolderName);
    if (!folder) return null;
    const candidateNames: string[] = [
      fileName,
      `${fileName}-coordinates`,
      fileName.replace(/_/g, ''),
      `${fileName.replace(/_/g, '')}-coordinates`,
    ];
    // Also try folder-based name
    const folderBaseName = folderName.includes('/') ? folderName.split('/').pop()! : folderName;
    const folderFileBase = folderBaseName.replace(/_/g, '');
    candidateNames.push(folderFileBase, `${folderFileBase}-coordinates`);

    const jsonData = await fetchJsonInFolderByCandidates(folder.id, candidateNames);
    if (jsonData && typeof jsonData === 'object' && typeof jsonData.imageName === 'string' && Array.isArray(jsonData.coordinates)) {
      jsonDataCache[cacheKey] = jsonData;
      return jsonData;
    }
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
    console.log("[Drive] checkFolderContents using Google Drive for", { folderName });
    const normalizedFolderName = folderName.replace(/\s+/g, ' ').trim();
    const folder = normalizedFolderName.includes('/')
      ? await resolveFolderByPath(normalizedFolderName)
      : await resolveFolderByNameUnderRoot(normalizedFolderName);
    if (!folder) {
      const result = { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
      folderContentsCache[cacheKey] = result;
      return result;
    }
    const folderBaseName = folderName.includes('/') ? folderName.split('/').pop()! : folderName;
    const fileBaseName = folderBaseName.replace(/_/g, '');

    // Check for JSON using same candidates as loadImageData
    const candidateNames: string[] = [
      fileBaseName,
      `${fileBaseName}-coordinates`,
      folderBaseName,
      `${folderBaseName}-coordinates`,
    ];
    let json = await fetchJsonInFolderByCandidates(folder.id, candidateNames);
    let detectedBase = json ? fileBaseName : null;

    // Fallback: scan for any *.json in folder and use its base name
    if (!json) {
      const files = await listFilesInFolder(folder.id);
      const anyJson = files.find(f => f.name.toLowerCase().endsWith('.json'));
      if (anyJson) {
        detectedBase = anyJson.name.replace(/\.json$/i, '').replace(/-coordinates$/i, '');
        json = await fetchJsonInFolderByCandidates(folder.id, [detectedBase!, `${detectedBase}-coordinates`]);
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
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};

/**
 * Get available folders from folders.json
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
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
 * Clear all caches to force fresh data
 */
export const clearCache = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
  Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key]);
  Object.keys(jsonDataCache).forEach(key => delete jsonDataCache[key]);
  Object.keys(folderExistsCache).forEach(key => delete folderExistsCache[key]);
  Object.keys(folderContentsCache).forEach(key => delete folderContentsCache[key]);
};
