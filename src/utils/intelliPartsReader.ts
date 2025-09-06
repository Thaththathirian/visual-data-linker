import { IntelliPartsItem } from "@/types";
import { parseIntelliPartsCSV } from "./csvParser";

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
  try {
    // Read the local CSV file from public/IntelliParts/index.csv
    const response = await fetch('/IntelliParts/index.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch IntelliParts CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    if (!csvContent.trim()) {
      throw new Error('IntelliParts index.csv file is empty');
    }

    const items = await parseIntelliPartsCSV(csvContent);
    console.log('Loaded IntelliParts items:', items.length);
    return items;
  } catch (error) {
    console.error('Error reading IntelliParts data:', error);
    throw error;
  }
};

export const groupIntelliPartsByCategory = (items: IntelliPartsItem[]): IntelliPartsCategoryGroup[] => {
  const categoryMap = new Map<string, IntelliPartsCategoryGroup>();
  
  items.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, { 
        name: item.category, 
        subcategories: [], 
        machines: [],
        items: [] 
      });
    }
    
    const category = categoryMap.get(item.category)!;
    
    // Add subcategory if not already present
    if (item.sub_category && !category.subcategories.includes(item.sub_category)) {
      category.subcategories.push(item.sub_category);
    }
    
    // Add machine if not already present
    if (item.machine_name && !category.machines.includes(item.machine_name)) {
      category.machines.push(item.machine_name);
    }
    
    category.items.push(item);
  });
  
  return Array.from(categoryMap.values());
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
