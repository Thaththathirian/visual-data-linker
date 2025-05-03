
import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";
import { toast } from "sonner";

/**
 * Determines if we're running in production environment
 */
const isProd = (): boolean => {
  return import.meta.env.PROD || window.location.hostname.includes('netlify.app');
}

/**
 * Gets the appropriate base path for data files based on environment
 */
const getBasePath = (): string => {
  // In both production and development, we'll try to use the public folder first
  // This makes it consistent between environments
  return '/data';
}

/**
 * Gets the appropriate table path based on environment
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
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // First, try to find the file with the exact same base name as JSON/CSV
  for (const ext of extensions) {
    // Try with folder structure
    const url = `${basePath}/${folderName}/${baseName}${ext}`;
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
  
  // Look for any image files in the folder
  try {
    // This is just a fallback approach - try known patterns
    const imageFiles = [
      'test_Brother814_Needle_Bar_Mechanism_2.png', 
      'Brother814_Needle_Bar_Mechanism.jpg',
      'diagram.png',
      'mechanism.jpg',
      'parts.png'
    ];
    
    for (const imgFile of imageFiles) {
      const url = `${basePath}/${folderName}/${imgFile}`;
      try {
        const img = new Image();
        const imagePromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        
        img.src = url;
        const exists = await imagePromise;
        
        if (exists) {
          console.log(`Found alternate image: ${url}`);
          return url;
        }
      } catch (err) {
        console.log(`Error testing alternate image at ${url}:`, err);
      }
    }
  } catch (err) {
    console.log('Error finding alternative image:', err);
  }
  
  // Try development path as fallback - this helps during development
  if (!isProd()) {
    try {
      // Fallback to src/data for development
      const devBasePath = '/src/data';
      for (const ext of extensions) {
        const url = `${devBasePath}/${folderName}/${baseName}${ext}`;
        
        const img = new Image();
        const imagePromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        
        img.src = url;
        const exists = await imagePromise;
        
        if (exists) {
          console.log(`Found image in development path: ${url}`);
          return url;
        }
      }
      
      // Check for test_Brother814_Needle_Bar_Mechanism_2.png in dev path
      const devTestPath = `${devBasePath}/${folderName}/test_Brother814_Needle_Bar_Mechanism_2.png`;
      const img = new Image();
      const imagePromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      
      img.src = devTestPath;
      const exists = await imagePromise;
      
      if (exists) {
        console.log(`Found dev test image: ${devTestPath}`);
        return devTestPath;
      }
    } catch (err) {
      console.log('Error with development fallback:', err);
    }
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
    let filePath = `${basePath}/${folderName}/${baseName}.csv`;
    console.log(`Fetching CSV file from: ${filePath}`);

    let response = await fetch(filePath);
    
    // If not found in public/data, try src/data (development fallback)
    if (!response.ok && !isProd()) {
      const devPath = `/src/data/${folderName}/${baseName}.csv`;
      console.log(`Trying development path for CSV: ${devPath}`);
      response = await fetch(devPath);
    }
    
    if (!response.ok) {
      console.error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load CSV file`);
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
    
    // Get the appropriate base path
    const basePath = getBasePath();
    let jsonData: ImageData | null = null;
    
    try {
      const jsonPath = `${basePath}/${folderName}/${baseName}.json`;
      
      console.log(`Attempting to load JSON from: ${jsonPath}`);
      let response = await fetch(jsonPath);
      
      // If not found in public/data, try src/data (development fallback)
      if (!response.ok && !isProd()) {
        const devPath = `/src/data/${folderName}/${baseName}.json`;
        console.log(`Trying development path for JSON: ${devPath}`);
        response = await fetch(devPath);
      }
      
      if (!response.ok) {
        console.log(`Failed to load JSON with status ${response.status}`);
        
        // Try finding any JSON file in the folder as fallback
        try {
          // Try a few common basenames for mechanism diagrams
          const alternateBaseNames = [
            "Brother814_Needle_Bar_Mechanism",
            "diagram",
            "parts",
            "mechanism"
          ];
          
          for (const altName of alternateBaseNames) {
            const alternatePath = `${basePath}/${folderName}/${altName}.json`;
            
            console.log(`Trying alternate JSON path: ${alternatePath}`);
            
            try {
              const altResponse = await fetch(alternatePath);
              if (!altResponse.ok && !isProd()) {
                // Try development path for alternate
                const devAltPath = `/src/data/${folderName}/${altName}.json`;
                const devAltResponse = await fetch(devAltPath);
                if (devAltResponse.ok) {
                  jsonData = await devAltResponse.json();
                  if (jsonData && jsonData.coordinates) {
                    console.log(`Successfully loaded alternate JSON data from dev path: ${devAltPath}`);
                    return jsonData;
                  }
                }
                continue;
              }
              
              if (!altResponse.ok) continue;
              
              try {
                jsonData = await altResponse.json();
                if (jsonData && jsonData.coordinates) {
                  console.log(`Successfully loaded alternate JSON data from ${altName}.json`);
                  return jsonData;
                }
              } catch (parseErr) {
                console.log(`Failed to parse JSON from ${alternatePath}`);
                continue;
              }
            } catch (altErr) {
              console.log(`Failed alternate JSON attempt for ${altName}: ${altErr}`);
            }
          }
        } catch (fallbackErr) {
          console.error(`Failed all JSON fallbacks: ${fallbackErr}`);
        }
        
        throw new Error(`No valid JSON file found for ${folderName}`);
      }
      
      // Check content type and parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        jsonData = await response.json();
        console.log(`Successfully loaded JSON data for ${folderName}/${baseName}`);
        return jsonData;
      } else {
        // Even if content-type is not application/json, try parsing it anyway
        // Some servers might not set the content type correctly
        try {
          jsonData = await response.json();
          if (jsonData) {
            console.log(`Successfully loaded JSON data despite content type: ${contentType}`);
            return jsonData;
          }
        } catch (parseErr) {
          throw new Error(`Invalid content type: ${contentType}, expected JSON`);
        }
      }
    } catch (err) {
      console.log(`Error with JSON load attempt: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
    
    if (!jsonData) {
      console.error(`No JSON data could be loaded for ${folderName}/${baseName}`);
      return null;
    }
    
    return jsonData;
  } catch (err) {
    console.error(`Error loading image data for ${folderName}/${fileName}:`, err);
    return null;
  }
};

/**
 * Try to detect available folders by checking for common file patterns
 */
const tryDetectFolders = async (): Promise<string[]> => {
  try {
    console.log("Attempting dynamic folder detection");
    
    const basePath = getBasePath();
    
    // List of known folder patterns to try
    const folderPatterns = [
      // Standard folder patterns
      'test_Brother_814_Needle_Bar_Mechanism',
      'test2_Brother_814_Needle_Bar_Mechanism', 
      'test3_Brother_814_Needle_Bar_Mechanism',
      'test4_Brother_814_Needle_Bar_Mechanism',
      'test5_Brother_814_Needle_Bar_Mechanism',
      'Brother_814_Needle_Bar_Mechanism',
      // Generic mechanism patterns
      'diagram_data',
      'mechanism_diagrams', 
      'sewing_machine_parts',
      // Additional patterns that might be used
      'mechanism',
      'parts',
      'diagrams'
    ];
    
    // Check if we can detect folders by combining patterns and checking file existence
    const detectedFolders: string[] = [];
    const foundFolders = new Set<string>();
    
    // Check well-known folder patterns
    for (const pattern of folderPatterns) {
      try {
        // Try to access a JSON file in this potential folder
        const checkPaths = [
          `${basePath}/${pattern}/Brother814_Needle_Bar_Mechanism.json`,
          `${basePath}/${pattern}/diagram.json`,
          `${basePath}/${pattern}/parts.json`,
          `${basePath}/${pattern}/mechanism.json`
        ];
        
        for (const checkPath of checkPaths) {
          try {
            // Use fetch with HEAD method to check if file exists without downloading content
            const response = await fetch(checkPath, { method: 'HEAD' });
            
            if (response.ok) {
              if (!foundFolders.has(pattern)) {
                foundFolders.add(pattern);
                detectedFolders.push(pattern);
                console.log(`Detected folder in public path: ${pattern}`);
                break;  // Found a valid file in this folder, no need to check more
              }
            }
          } catch (pathErr) {
            // Ignore errors for individual path checks
          }
        }
      } catch (err) {
        // Ignore errors for pattern checks
      }
    }
    
    // In development, try src/data path too
    if (!isProd() && detectedFolders.length === 0) {
      const devBasePath = '/src/data';
      console.log("Trying src/data path for development...");
      
      for (const pattern of folderPatterns) {
        try {
          // Check for JSON file in development path
          const checkPaths = [
            `${devBasePath}/${pattern}/Brother814_Needle_Bar_Mechanism.json`,
            `${devBasePath}/${pattern}/diagram.json`,
            `${devBasePath}/${pattern}/parts.json`,
            `${devBasePath}/${pattern}/mechanism.json`
          ];
          
          for (const checkPath of checkPaths) {
            try {
              const response = await fetch(checkPath, { method: 'HEAD' });
              
              if (response.ok) {
                if (!foundFolders.has(pattern)) {
                  foundFolders.add(pattern);
                  detectedFolders.push(pattern);
                  console.log(`Detected folder in development path: ${pattern}`);
                  break;
                }
              }
            } catch (pathErr) {
              // Ignore individual path errors
            }
          }
        } catch (err) {
          // Ignore pattern errors
        }
      }
    }
    
    return detectedFolders;
  } catch (err) {
    console.error("Error in dynamic folder detection:", err);
    return [];
  }
};

/**
 * Dynamically scan available directories in data folders
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    console.log("Starting folder detection");
    
    // First try dynamic folder detection - this works in both dev and prod
    const dynamicFolders = await tryDetectFolders();
    if (dynamicFolders.length > 0) {
      console.log("Found folders through dynamic detection:", dynamicFolders);
      return dynamicFolders;
    }
    
    // If no folders detected dynamically, try the development data folders
    if (!isProd()) {
      console.log("No folders detected. Falling back to development folders");
      const devFolders = [
        'test_Brother_814_Needle_Bar_Mechanism',
        'test2_Brother_814_Needle_Bar_Mechanism',
        'test3_Brother_814_Needle_Bar_Mechanism',
        'test4_Brother_814_Needle_Bar_Mechanism',
        'test5_Brother_814_Needle_Bar_Mechanism',
        'Brother_814_Needle_Bar_Mechanism'
      ];
      
      // Check for any development folders that exist
      const existingDevFolders = [];
      for (const folder of devFolders) {
        try {
          const testPath = `/src/data/${folder}/Brother814_Needle_Bar_Mechanism.json`;
          const response = await fetch(testPath, { method: 'HEAD' });
          if (response.ok) {
            existingDevFolders.push(folder);
          }
        } catch (err) {
          // Skip folders that don't exist
        }
      }
      
      if (existingDevFolders.length > 0) {
        console.log("Found existing development folders:", existingDevFolders);
        return existingDevFolders;
      }
    }
    
    console.log("Could not detect any valid folders. Returning placeholder");
    // If we've exhausted all options, return at least the default folder names
    // to show proper error messages to the user
    return ['test_Brother_814_Needle_Bar_Mechanism', 'Brother_814_Needle_Bar_Mechanism'];
  } catch (err) {
    console.error('Error detecting folders:', err);
    // Ultimate fallback - return at least one known folder
    return ['test_Brother_814_Needle_Bar_Mechanism'];
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
    const basePath = getBasePath();
    const devBasePath = !isProd() ? '/src/data' : '';
    
    console.log(`Checking contents of folder: ${folderName} at base path: ${basePath}`);
    
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
    
    // First check the public/data path
    for (const bName of knownBaseNames) {
      // Check for JSON file with this basename
      try {
        const jsonPath = `${basePath}/${folderName}/${bName}.json`;
        console.log(`Checking for JSON: ${jsonPath}`);
        const jsonResponse = await fetch(jsonPath, { method: 'HEAD' });
        if (jsonResponse.ok) {
          hasJson = true;
          baseName = bName;
          console.log(`Found JSON file: ${bName}.json in folder ${folderName}`);
          break; // Stop once we find a valid JSON
        }
      } catch (err) {
        console.log(`Error checking for ${bName}.json:`, err);
      }
    }
    
    // If not found in public path and in development, try src/data
    if (!hasJson && !isProd() && devBasePath) {
      for (const bName of knownBaseNames) {
        try {
          const jsonPath = `${devBasePath}/${folderName}/${bName}.json`;
          console.log(`Checking for JSON in dev path: ${jsonPath}`);
          const jsonResponse = await fetch(jsonPath, { method: 'HEAD' });
          if (jsonResponse.ok) {
            hasJson = true;
            baseName = bName;
            console.log(`Found JSON file in dev path: ${bName}.json in folder ${folderName}`);
            break;
          }
        } catch (err) {
          console.log(`Error checking for dev ${bName}.json:`, err);
        }
      }
    }
    
    // If we found a valid baseName, check for matching CSV
    if (baseName) {
      // First try public path
      try {
        const csvPath = `${basePath}/${folderName}/${baseName}.csv`;
        console.log(`Checking for CSV: ${csvPath}`);
        const csvResponse = await fetch(csvPath, { method: 'HEAD' });
        hasCsv = csvResponse.ok;
        if (hasCsv) {
          console.log(`Found matching CSV file: ${baseName}.csv`);
        }
      } catch (err) {
        console.log(`Error checking for ${baseName}.csv:`, err);
      }
      
      // If not found and in dev mode, check src/data
      if (!hasCsv && !isProd() && devBasePath) {
        try {
          const csvPath = `${devBasePath}/${folderName}/${baseName}.csv`;
          console.log(`Checking for CSV in dev path: ${csvPath}`);
          const csvResponse = await fetch(csvPath, { method: 'HEAD' });
          hasCsv = csvResponse.ok;
          if (hasCsv) {
            console.log(`Found matching CSV file in dev path: ${baseName}.csv`);
          }
        } catch (err) {
          console.log(`Error checking for dev ${baseName}.csv:`, err);
        }
      }
      
      // Check for matching image with various extensions in public path
      const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
      for (const ext of imageExts) {
        try {
          const imgPath = `${basePath}/${folderName}/${baseName}${ext}`;
          console.log(`Checking for image: ${imgPath}`);
          
          const img = new Image();
          const imagePromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          
          img.src = imgPath;
          hasImage = await imagePromise;
          
          if (hasImage) {
            console.log(`Found image file: ${baseName}${ext} in ${folderName}`);
            break;
          }
        } catch (err) {
          console.log(`Error checking for ${baseName}${ext}:`, err);
        }
      }
      
      // If image not found and in dev mode, check src/data
      if (!hasImage && !isProd() && devBasePath) {
        for (const ext of imageExts) {
          try {
            const imgPath = `${devBasePath}/${folderName}/${baseName}${ext}`;
            console.log(`Checking for image in dev path: ${imgPath}`);
            
            const img = new Image();
            const imagePromise = new Promise<boolean>((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            });
            
            img.src = imgPath;
            hasImage = await imagePromise;
            
            if (hasImage) {
              console.log(`Found image file in dev path: ${baseName}${ext} in ${folderName}`);
              break;
            }
          } catch (err) {
            console.log(`Error checking for dev ${baseName}${ext}:`, err);
          }
        }
      }
      
      // If no direct image match, try common patterns
      if (!hasImage) {
        // Try the Brother 814 specific image
        try {
          const imgPath = `${basePath}/${folderName}/test_Brother814_Needle_Bar_Mechanism_2.png`;
          console.log(`Checking for alternate image: ${imgPath}`);
          
          const img = new Image();
          const imagePromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          
          img.src = imgPath;
          hasImage = await imagePromise;
          
          if (hasImage) {
            console.log(`Found alternate image file in ${folderName}`);
          }
        } catch (err) {
          console.log(`Error checking for alternate image:`, err);
        }
        
        // Try in development path if not found
        if (!hasImage && !isProd() && devBasePath) {
          try {
            const imgPath = `${devBasePath}/${folderName}/test_Brother814_Needle_Bar_Mechanism_2.png`;
            console.log(`Checking for alternate image in dev path: ${imgPath}`);
            
            const img = new Image();
            const imagePromise = new Promise<boolean>((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            });
            
            img.src = imgPath;
            hasImage = await imagePromise;
            
            if (hasImage) {
              console.log(`Found alternate image file in dev path for ${folderName}`);
            }
          } catch (err) {
            console.log(`Error checking for dev alternate image:`, err);
          }
        }
      }
    }
    
    console.log(`Folder ${folderName} check results: JSON: ${hasJson}, CSV: ${hasCsv}, Image: ${hasImage}, Base name: ${baseName}`);
    return { hasJson, hasCsv, hasImage, baseName };
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};
