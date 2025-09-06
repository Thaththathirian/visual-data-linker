import { IntelliPartsItem } from "@/types";
import { parseIntelliPartsCSV } from "./csvParser";
import dataCache from "./dataCache";

// Convert local index.csv format to IntelliParts format
const convertIndexToIntelliParts = async (csvContent: string): Promise<IntelliPartsItem[]> => {
  const Papa = await import('papaparse');
  
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse the header line
  const parsedHeader = Papa.parse(lines[0]);
  const headers = parsedHeader.data[0] as string[];
  console.log('[Convert Index] Headers found:', headers);

  const dataRows = lines.slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const items: IntelliPartsItem[] = dataRows.map((line, index) => {
    // Parse the CSV line
    const parsedLine = Papa.parse(line);
    const values = parsedLine.data[0] as string[];

    const data: Record<string, any> = {};
    headers.forEach((header, idx) => {
      if (idx < values.length) {
        data[header] = values[idx] || '';
      } else {
        data[header] = '';
      }
    });

    // Convert to IntelliParts format
    const item: IntelliPartsItem = {
      category: data.category || '',
      sub_category: data.type || '', // Use 'type' as sub_category
      machine_name: data.model || '', // Use 'model' as machine_name
      sparepartspage_name: data.product_name || '',
      sparepartspage_path: data.product_path || '',
      related_machines: data.relative_products || '',
      other_pages: '', // Not available in local format
      brand: data.brand || ''
    };

    console.log(`[Convert Index] Created item ${index + 1}:`, item);
    return item;
  });

  console.log(`[Convert Index] Total converted items: ${items.length}`);
  return items;
};

export interface IntelliPartsCategoryGroup {
  name: string;
  subcategories: string[];
  machines: string[];
  items: IntelliPartsItem[];
}

export interface IntelliPartsCategoryNode {
  name: string;
  children: Map<string, IntelliPartsCategoryNode>;
  items: IntelliPartsItem[];
}

export const readIntelliPartsFromLocal = async (): Promise<IntelliPartsItem[]> => {
  // Check cache first
  if (dataCache.hasIntelliPartsData()) {
    console.log('[Cache] Using cached IntelliParts data');
    return dataCache.getIntelliPartsData()!;
  }

  try {
    // First try to read from Google Drive
    const rootFolderId = import.meta.env.VITE_DRIVE_ROOT_FOLDER_ID;
    if (rootFolderId) {
      try {
        const { listFilesInFolder, getDriveDownloadUrl } = await import('./googleDrive');
        const files = await listFilesInFolder(rootFolderId);
        const indexFile = files.find(file => file.name.toLowerCase() === 'index.csv');
        if (indexFile) {
          const downloadUrl = getDriveDownloadUrl(indexFile.id);
          if (downloadUrl) {
            const response = await fetch(downloadUrl);
            if (response.ok) {
              const csvContent = await response.text();
              if (csvContent.trim()) {
                const items = await parseIntelliPartsCSV(csvContent);
                console.log('Loaded IntelliParts items from Google Drive:', items.length);
                
                // Debug: Check if we have categories and subcategories
                const categories = [...new Set(items.map(item => item.category))];
                const subcategories = [...new Set(items.map(item => item.sub_category).filter(Boolean))];
                const machines = [...new Set(items.map(item => item.machine_name).filter(Boolean))];
                
                console.log('IntelliParts categories found:', categories);
                console.log('IntelliParts subcategories found:', subcategories);
                console.log('IntelliParts machines found:', machines);
                console.log('Sample IntelliParts items:', items.slice(0, 3));
                
                // Cache the data
                dataCache.setIntelliPartsData(items);
                return items;
              }
            }
          }
        }
      } catch (driveError) {
        console.warn('Failed to read from Google Drive, falling back to local file:', driveError);
      }
    }

    // Fallback: Read from local index.csv and convert to IntelliParts format
    console.log('Reading from local index.csv and converting to IntelliParts format');
    const response = await fetch('/index.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch local index.csv: ${response.status} ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    if (!csvContent.trim()) {
      throw new Error('Local index.csv file is empty');
    }

    // Parse the local CSV and convert to IntelliParts format
    const items = await convertIndexToIntelliParts(csvContent);
    console.log('Converted IntelliParts items from local index.csv:', items.length);
    
    // Debug: Check if we have categories and subcategories
    const categories = [...new Set(items.map(item => item.category))];
    const subcategories = [...new Set(items.map(item => item.sub_category).filter(Boolean))];
    const machines = [...new Set(items.map(item => item.machine_name).filter(Boolean))];
    
    console.log('IntelliParts categories found:', categories);
    console.log('IntelliParts subcategories found:', subcategories);
    console.log('IntelliParts machines found:', machines);
    console.log('Sample IntelliParts items:', items.slice(0, 3));
    
    // Cache the data
    dataCache.setIntelliPartsData(items);
    
    return items;
  } catch (error) {
    console.error('Error reading IntelliParts data:', error);
    throw error;
  }
};

export const groupIntelliPartsByCategory = (items: IntelliPartsItem[]): IntelliPartsCategoryGroup[] => {
  console.log('[IntelliParts Grouping] Starting to group items:', items.length);
  const categoryMap = new Map<string, IntelliPartsCategoryGroup>();
  
  items.forEach((item, index) => {
    console.log(`[IntelliParts Grouping] Processing item ${index + 1}:`, {
      category: item.category,
      sub_category: item.sub_category,
      machine_name: item.machine_name,
      sparepartspage_name: item.sparepartspage_name
    });
    
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, { 
        name: item.category, 
        subcategories: [], 
        machines: [],
        items: [] 
      });
      console.log(`[IntelliParts Grouping] Created new category: ${item.category}`);
    }
    
    const category = categoryMap.get(item.category)!;
    
    // Add subcategory if not already present
    if (item.sub_category && !category.subcategories.includes(item.sub_category)) {
      category.subcategories.push(item.sub_category);
      console.log(`[IntelliParts Grouping] Added subcategory: ${item.sub_category} to category: ${item.category}`);
    }
    
    // Add machine if not already present
    if (item.machine_name && !category.machines.includes(item.machine_name)) {
      category.machines.push(item.machine_name);
      console.log(`[IntelliParts Grouping] Added machine: ${item.machine_name} to category: ${item.category}`);
    }
    
    category.items.push(item);
  });
  
  const result = Array.from(categoryMap.values());
  console.log('[IntelliParts Grouping] Final grouped categories:', result.map(cat => ({
    name: cat.name,
    subcategories: cat.subcategories,
    machines: cat.machines,
    itemCount: cat.items.length
  })));
  
  return result;
};

export const buildIntelliPartsCategoryTree = (items: IntelliPartsItem[]): IntelliPartsCategoryNode => {
  const root: IntelliPartsCategoryNode = { name: 'root', children: new Map(), items: [] };
  
  items.forEach((item) => {
    // Build path: Category > Sub-Category > Machine Name
    const pathLevels = [item.category, item.sub_category, item.machine_name].filter(Boolean);
    let current = root;
    
    for (const level of pathLevels) {
      if (!current.children.has(level)) {
        current.children.set(level, { name: level, children: new Map(), items: [] });
      }
      current = current.children.get(level)!;
    }
    
    current.items.push(item);
  });
  
  return root;
};

export const getIntelliPartsByCategory = (items: IntelliPartsItem[], category: string): IntelliPartsItem[] => {
  return items.filter(item => item.category === category);
};

export const getIntelliPartsBySubcategory = (items: IntelliPartsItem[], category: string, subcategory: string): IntelliPartsItem[] => {
  return items.filter(item => item.category === category && item.sub_category === subcategory);
};

export const getIntelliPartsByMachine = (items: IntelliPartsItem[], machineName: string): IntelliPartsItem[] => {
  return items.filter(item => item.machine_name === machineName);
};

export const getIntelliPartsByBrand = (items: IntelliPartsItem[], brand: string): IntelliPartsItem[] => {
  return items.filter(item => item.brand === brand);
};

export const getMachineThumbnailPath = (machineName: string): string => {
  // Return the path to the machine thumbnail in Machine Images folder
  return `/IntelliParts/Machine Images/${machineName}.png`;
};

/**
 * Get machine thumbnail from Google Drive by machine name
 * Searches for image files with the machine name in Google Drive
 */
export const getMachineThumbnailFromDrive = async (machineName: string): Promise<string | null> => {
  const cacheKey = `driveMachineThumbnail:${machineName}`;
  
  // Check cache first
  const cachedUrl = dataCache.getImageUrl(cacheKey);
  if (cachedUrl) {
    console.log(`[Cache] Using cached machine thumbnail for ${machineName}`);
    return cachedUrl;
  }

  try {
    const { isDriveEnabled, findFolderByExactName, listFilesInFolder, getDriveDownloadUrl } = await import('@/utils/googleDrive');
    
    if (!isDriveEnabled()) {
      console.log('[Drive] Google Drive not enabled, falling back to local machine images');
      return null;
    }

    console.log(`[Drive] Searching for machine image: "${machineName}"`);
    
    // First, try to find a "Machine Images" folder in Google Drive
    const machineImagesFolder = await findFolderByExactName('Machine Images');
    if (machineImagesFolder) {
      console.log(`[Drive] Found Machine Images folder: ${machineImagesFolder.name}`);
      
      // Look for image files in the Machine Images folder
      const files = await listFilesInFolder(machineImagesFolder.id);
      const imageFiles = files.filter(file => 
        /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name)
      );
      
      // Try to find an image file that matches the machine name
      const normalizedMachineName = machineName.replace(/\s+/g, ' ').trim().toLowerCase();
      const matchingFile = imageFiles.find(file => {
        const fileName = file.name.toLowerCase();
        const baseName = fileName.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '');
        return baseName === normalizedMachineName || 
               baseName.includes(normalizedMachineName) ||
               normalizedMachineName.includes(baseName);
      });
      
      if (matchingFile) {
        const downloadUrl = getDriveDownloadUrl(matchingFile.id);
        console.log(`[Drive] Found machine image: ${matchingFile.name}`);
        dataCache.setImageUrl(cacheKey, downloadUrl);
        return downloadUrl;
      }
    }
    
    // If no Machine Images folder or no matching file, try searching for the machine name as a folder
    const machineFolder = await findFolderByExactName(machineName);
    if (machineFolder) {
      console.log(`[Drive] Found machine folder: ${machineFolder.name}`);
      
      // Look for image files in the machine folder
      const files = await listFilesInFolder(machineFolder.id);
      const imageFiles = files.filter(file => 
        /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name)
      );
      
      if (imageFiles.length > 0) {
        // Use the first image file found
        const imageFile = imageFiles[0];
        const downloadUrl = getDriveDownloadUrl(imageFile.id);
        console.log(`[Drive] Found machine image in folder: ${imageFile.name}`);
        dataCache.setImageUrl(cacheKey, downloadUrl);
        return downloadUrl;
      }
    }
    
    console.log(`[Drive] No machine image found for: "${machineName}"`);
    return null;
  } catch (error) {
    console.error(`[Drive] Error searching for machine image "${machineName}":`, error);
    return null;
  }
};

export const getProductImagePath = (productPath: string): string => {
  // Return the path to the product image
  return `/IntelliParts/Products/${productPath}/image.png`;
};

export const parseRelatedMachines = (relatedMachinesStr: string): string[] => {
  if (!relatedMachinesStr) return [];
  
  try {
    // Remove brackets and split by comma
    const cleaned = relatedMachinesStr.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(machine => machine.trim()).filter(Boolean);
  } catch (error) {
    console.error('Error parsing related machines:', error);
    return [];
  }
};

export const parseOtherPages = (otherPagesStr: string): string[] => {
  if (!otherPagesStr) return [];
  
  try {
    // Remove brackets and split by comma
    const cleaned = otherPagesStr.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(page => page.trim()).filter(Boolean);
  } catch (error) {
    console.error('Error parsing other pages:', error);
    return [];
  }
};
