import { FolderItem, FileItem } from '@/types';
import { getDirectoryContents } from './folderDataUtils';

// Cache for folder contents to avoid repeated requests
const folderCache: Record<string, (FolderItem | FileItem)[]> = {};
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps: Record<string, number> = {};

/**
 * Get the base path for data files
 */
const getBasePath = (): string => {
  return '/data';
};

/**
 * Check if a file has coordinates (JSON files with coordinate data)
 */
const hasCoordinates = async (filePath: string): Promise<boolean> => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) return false;
    
    const data = await response.json();
    return data && Array.isArray(data.coordinates) && data.coordinates.length > 0;
  } catch (err) {
    return false;
  }
};

/**
 * Determine if a folder contains a valid set: JSON with coordinates + CSV + image
 */
export const folderHasWorkingCoordinates = async (folderPath: string): Promise<boolean> => {
  try {
    const items = getDirectoryContents(folderPath);
    const files = items.filter(i => i.type !== 'folder');

    // Build quick lookup sets by normalized base name
    const csvBases = new Set<string>();
    const imageBases = new Set<string>();
    const jsonCandidates: { base: string; path: string }[] = [];

    const toBase = (name: string) => name
      .replace(/\.(json|csv|png|jpe?g|webp|gif)$/i, '')
      .replace(/-coordinates$/i, '');

    for (const f of files) {
      const base = toBase(f.name);
      if (f.type === 'csv') csvBases.add(base);
      if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(f.type)) imageBases.add(base);
      if (f.type === 'json') jsonCandidates.push({ base, path: `${getBasePath()}/${f.path}` });
    }

    // Check each JSON candidate actually has coordinates and matching csv+image
    const checks = await Promise.all(jsonCandidates.map(async ({ base, path }) => {
      const okJson = await hasCoordinates(path);
      return okJson && csvBases.has(base) && imageBases.has(base);
    }));

    return checks.some(Boolean);
  } catch {
    return false;
  }
};

/**
 * Get folder contents from the directory listing API
 */
export const getFolderContents = async (path: string): Promise<(FolderItem | FileItem)[]> => {
  const cacheKey = `folder:${path}`;
  
  // Check cache first
  if (folderCache[cacheKey] && cacheTimestamps[cacheKey] && 
      Date.now() - cacheTimestamps[cacheKey] < CACHE_TIMEOUT) {
    return folderCache[cacheKey];
  }
  
  try {
    // Use the new utility function instead of API call
    const rawItems = getDirectoryContents(path);
    const items: (FolderItem | FileItem)[] = [];
    
    for (const item of rawItems) {
      if (item.type === 'folder') {
        items.push({
          type: 'folder',
          name: item.name,
          itemCount: item.itemCount || 0,
          path: item.path
        });
      } else {
        // For files, check if JSON files have coordinates
        let hasCoords = false;
        if (item.type === 'json') {
          const filePath = `${getBasePath()}/${item.path}`;
          hasCoords = await hasCoordinates(filePath);
        }
        
        items.push({
          type: item.type as 'json' | 'csv' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif',
          name: item.name,
          path: `${getBasePath()}/${item.path}`,
          size: item.size,
          hasCoordinates: hasCoords
        });
      }
    }
    
    // Cache the results
    folderCache[cacheKey] = items;
    cacheTimestamps[cacheKey] = Date.now();
    
    return items;
  } catch (err) {
    console.error(`Error getting folder contents for ${path}:`, err);
    return [];
  }
};

/**
 * Clear folder cache
 */
export const clearFolderCache = () => {
  Object.keys(folderCache).forEach(key => delete folderCache[key]);
  Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key]);
};
