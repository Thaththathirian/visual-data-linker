
import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";

/**
 * Gets the appropriate table path based on environment
 */
export const getTablePath = (folderName: string, fileName: string) => {
  const isProd = import.meta.env.PROD;
  return isProd ? 
    `/data/${folderName}/${fileName}.csv` : 
    `/src/data/${folderName}/${fileName}.csv`;
};

/**
 * Gets the appropriate image path with fallback for different extensions
 */
export const getImagePath = async (folderName: string, fileName: string): Promise<string | null> => {
  // Strip any extension from the filename if present
  const baseName = fileName.includes('.') ? 
    fileName.substring(0, fileName.lastIndexOf('.')) : 
    fileName;
  
  // Try different common image extensions
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // Try direct URL first without checking (most reliable method)
  for (const ext of extensions) {
    // Try with folder structure
    const url = `/images/${folderName}/${baseName}${ext}`;
    console.log(`Attempting image access at: ${url}`);
    
    try {
      const img = new Image();
      const imagePromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      
      img.src = url;
      const exists = await imagePromise;
      
      if (exists) {
        console.log(`Success! Image loaded at: ${url}`);
        return url;
      }
    } catch (err) {
      console.log(`Error testing image at ${url}:`, err);
    }
  }
  
  // Fallback to development paths
  if (!import.meta.env.PROD) {
    for (const ext of extensions) {
      // Try directly in the folder
      const url = `/src/data/${folderName}/${baseName}${ext}`;
      try {
        console.log(`Trying development path: ${url}`);
        const img = new Image();
        const imagePromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        
        img.src = url;
        const exists = await imagePromise;
        
        if (exists) {
          console.log(`Success! Image loaded at development path: ${url}`);
          return url;
        }
      } catch (err) {
        console.log(`Error testing dev image at ${url}:`, err);
      }
    }
  }
  
  // Final fallback - try absolute URLs
  const origin = window.location.origin;
  for (const ext of extensions) {
    const url = `${origin}/images/${folderName}/${baseName}${ext}`;
    try {
      console.log(`Trying absolute URL: ${url}`);
      const img = new Image();
      const imagePromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      
      img.src = url;
      const exists = await imagePromise;
      
      if (exists) {
        console.log(`Success! Image loaded at absolute URL: ${url}`);
        return url;
      }
    } catch (err) {
      console.log(`Error testing absolute URL image at ${url}:`, err);
    }
  }
  
  console.error(`No valid image found for ${folderName}/${baseName} after trying all options`);
  
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
    const csvFileName = `${baseName}.csv`;
    
    const filePath = getTablePath(folderName, baseName);
    console.log(`Fetching CSV file from: ${filePath}`);

    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load CSV from ${filePath}`);
    }

    const csvText = await response.text();
    const parsedData = parseCSV(csvText);
    console.log(`Successfully parsed CSV with ${parsedData.length} rows for ${baseName}`);

    return parsedData;
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
      
    console.log(`Loading image data for: ${folderName}/${baseName}`);
    
    // Check if we're in development or production mode
    const isProd = import.meta.env.PROD;
    let jsonData;
    
    if (isProd) {
      // In production, load from public/data folder
      const response = await fetch(`/data/${folderName}/${baseName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load JSON from /data/${folderName}/${baseName}.json`);
      }
      jsonData = await response.json();
    } else {
      // In development, try to load from src/data folder using fetch
      try {
        // Use relative path to fetch resources in development
        const response = await fetch(`/src/data/${folderName}/${baseName}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load JSON from /src/data/${folderName}/${baseName}.json`);
        }
        jsonData = await response.json();
      } catch (err) {
        console.error(`Failed to fetch JSON for ${folderName}/${baseName}:`, err);
        throw err;
      }
    }
    
    console.log(`Successfully loaded image data for ${folderName}/${baseName}`);
    return jsonData as ImageData;
  } catch (err) {
    console.error(`Error loading image data for ${folderName}/${fileName}:`, err);
    return null;
  }
};

/**
 * Get available folders that may contain diagram data
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    const isProd = import.meta.env.PROD;
    
    // Use a static list of folder paths for development
    // In a real application, you might want to create a manifest file
    if (isProd) {
      // For production, we'd use a manifest file
      try {
        const response = await fetch('/data/folders.json');
        if (response.ok) {
          const data = await response.json();
          return data.folders || [];
        }
      } catch (err) {
        console.error('Error fetching folders list:', err);
      }
      return [];
    } else {
      // In development, use a hard-coded list or a simple fetch API
      // This is a simplified approach - you may need to adapt this based on your setup
      
      // List of known folders - update manually when adding new folders
      const knownFolders = ['test_Brother_814_Needle_Bar_Mechanism'];
      
      // Alternatively, try to fetch a manifest if available
      try {
        const response = await fetch('/src/data/folders.json');
        if (response.ok) {
          const data = await response.json();
          return data.folders || knownFolders;
        }
      } catch (err) {
        // Silently fall back to known folders
      }
      
      console.log('Using known folders:', knownFolders);
      return knownFolders;
    }
  } catch (err) {
    console.error('Error getting available folders:', err);
    return [];
  }
};

/**
 * Check if a folder has the required files (JSON, CSV, image)
 */
export const checkFolderContents = async (folderName: string): Promise<{
  hasJson: boolean;
  hasCsv: boolean;
  hasImage: boolean;
  baseName: string | null;
}> => {
  try {
    const isProd = import.meta.env.PROD;
    let baseName = null;
    let hasJson = false;
    let hasCsv = false;
    let hasImage = false;
    
    // Use fetch API instead of import.meta.glob
    if (!isProd) {
      // First, try to find a JSON file using common naming patterns
      const commonJsonNames = [
        `${folderName}`, // Same as folder name
        `${folderName.replace(/^test_/, '')}` // Without 'test_' prefix
      ];
      
      for (const name of commonJsonNames) {
        try {
          const jsonResponse = await fetch(`/src/data/${folderName}/${name}.json`);
          if (jsonResponse.ok) {
            hasJson = true;
            baseName = name;
            break;
          }
        } catch (err) {
          // Continue to next name
        }
      }
      
      // If no match found, try more generic approach (first .json we can find)
      if (!baseName) {
        try {
          // Note: This is a simple approach. In a real app, you might
          // want to implement a server endpoint to list files in a directory.
          const manifestResponse = await fetch(`/src/data/${folderName}/manifest.json`);
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json();
            if (manifest.baseName) {
              baseName = manifest.baseName;
              hasJson = true;
            }
          }
        } catch (err) {
          // Fall back to assuming a file with the folder name exists
          baseName = folderName.replace(/^test_/, '');
          
          // Try to verify if it exists
          try {
            const jsonResponse = await fetch(`/src/data/${folderName}/${baseName}.json`);
            hasJson = jsonResponse.ok;
          } catch (err) {
            // If we can't verify, we'll assume it exists and let the load fail later if needed
            hasJson = false;
          }
        }
      }
      
      // Check for CSV file with the same base name
      if (baseName) {
        try {
          const csvResponse = await fetch(`/src/data/${folderName}/${baseName}.csv`);
          hasCsv = csvResponse.ok;
        } catch (err) {
          // If we can't verify, we'll check during actual load
          hasCsv = false;
        }
        
        // For images, we'll need to actually try loading one
        const imagePath = await getImagePath(folderName, baseName);
        hasImage = imagePath !== null && !imagePath.includes('placeholder');
      }
    } else {
      // For production, we would need to fetch a manifest or make requests
      try {
        const response = await fetch(`/data/${folderName}/manifest.json`);
        if (response.ok) {
          const manifest = await response.json();
          return {
            hasJson: manifest.hasJson || false,
            hasCsv: manifest.hasCsv || false,
            hasImage: manifest.hasImage || false,
            baseName: manifest.baseName || null
          };
        }
      } catch (err) {
        // If no manifest, try common naming patterns
        const possibleBaseName = folderName.replace(/^test_/, '');
        
        // Try to verify JSON exists
        try {
          const jsonResponse = await fetch(`/data/${folderName}/${possibleBaseName}.json`);
          if (jsonResponse.ok) {
            hasJson = true;
            baseName = possibleBaseName;
          }
        } catch (err) {
          // Continue with checks
        }
        
        // Check for CSV
        if (baseName) {
          try {
            const csvResponse = await fetch(`/data/${folderName}/${baseName}.csv`);
            hasCsv = csvResponse.ok;
          } catch (err) {
            // Continue
          }
          
          // For images, try loading
          const imagePath = await getImagePath(folderName, baseName);
          hasImage = imagePath !== null && !imagePath.includes('placeholder');
        }
      }
    }
    
    console.log(`Folder ${folderName} check: JSON: ${hasJson}, CSV: ${hasCsv}, Image: ${hasImage}, Base name: ${baseName}`);
    return { hasJson, hasCsv, hasImage, baseName };
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};
