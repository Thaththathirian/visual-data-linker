
import { TableRow, ImageData } from "@/types";
import { parseCSV } from "@/utils/csvParser";
import { toast } from "sonner";

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
  
  // First, try to find the file with the exact same base name as JSON/CSV
  for (const ext of extensions) {
    // Try with folder structure
    const url = `/src/data/${folderName}/${baseName}${ext}`;
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
    // Common image file pattern searches
    const imagePatterns = [
      'test_*.png', 
      '*_Mechanism*.png', 
      '*_Mechanism*.jpg',
      '*.jpg',
      '*.png'
    ];
    
    // This is just a fallback approach - try known patterns
    const imageFiles = [
      'test_Brother814_Needle_Bar_Mechanism_2.png', 
      'Brother814_Needle_Bar_Mechanism.jpg',
      'diagram.png',
      'mechanism.jpg',
      'parts.png'
    ];
    
    for (const imgFile of imageFiles) {
      const url = `/src/data/${folderName}/${imgFile}`;
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
    let jsonData: ImageData | null = null;
    
    try {
      // Try to load from src/data folder using fetch
      const jsonPath = isProd ? 
        `/data/${folderName}/${baseName}.json` : 
        `/src/data/${folderName}/${baseName}.json`;
      
      console.log(`Attempting to load JSON from: ${jsonPath}`);
      const response = await fetch(jsonPath);
      
      if (!response.ok) {
        console.log(`Failed to load JSON from ${jsonPath} with status ${response.status}`);
        throw new Error(`Failed to load JSON from ${jsonPath}`);
      }
      
      // Check content type and parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        jsonData = await response.json();
        console.log(`Successfully loaded JSON data for ${folderName}/${baseName}`);
        return jsonData;
      } else {
        throw new Error(`Invalid content type: ${contentType}, expected JSON`);
      }
    } catch (err) {
      console.log(`Error with JSON load attempt: ${err instanceof Error ? err.message : String(err)}`);
      
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
          const alternatePath = isProd ? 
            `/data/${folderName}/${altName}.json` : 
            `/src/data/${folderName}/${altName}.json`;
          
          console.log(`Trying alternate JSON path: ${alternatePath}`);
          
          try {
            const response = await fetch(alternatePath);
            if (!response.ok) continue;
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) continue;
            
            jsonData = await response.json();
            if (jsonData && jsonData.coordinates) {
              console.log(`Successfully loaded alternate JSON data from ${altName}.json`);
              return jsonData;
            }
          } catch (altErr) {
            console.log(`Failed alternate JSON attempt for ${altName}: ${altErr}`);
          }
        }
      } catch (fallbackErr) {
        console.error(`Failed all JSON fallbacks: ${fallbackErr}`);
      }
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
 * Dynamically scan available directories in src/data 
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    console.log("Starting folder detection");

    // In production, we'd check a folders.json manifest
    const isProd = import.meta.env.PROD;
    if (isProd) {
      try {
        console.log("Checking production folders.json");
        const response = await fetch('/data/folders.json');
        if (response.ok) {
          const data = await response.json();
          console.log("Found folders.json with folders:", data.folders);
          return data.folders || [];
        }
      } catch (err) {
        console.error('Error loading production folders:', err);
      }
    }
    
    // Direct folder detection approach
    try {
      // Try to fetch a listing endpoint (if available)
      const listingUrl = isProd ? '/data/folders.json' : '/src/data/';
      const response = await fetch(listingUrl);
      
      if (response.ok) {
        // This might be possible if the server supports directory listings
        if (response.headers.get('content-type')?.includes('json')) {
          const data = await response.json();
          if (data && Array.isArray(data.folders)) {
            return data.folders;
          }
        }
      }
    } catch (err) {
      console.log("Directory listing not available:", err);
    }
    
    // Test each known/potential folder to see if it exists
    const potentialFolders = [
      'test_Brother_814_Needle_Bar_Mechanism',
      'test2_Brother_814_Needle_Bar_Mechanism',
      'test3_Brother_814_Needle_Bar_Mechanism',
      'Brother_814_Needle_Bar_Mechanism',
      'diagram_data',
      'mechanism_diagrams',
      'sewing_machine_parts'
    ];
    
    const existingFolders: string[] = [];
    
    for (const folder of potentialFolders) {
      try {
        // Check if a JSON file exists in this folder - if yes, it's probably valid
        const testPath = isProd ? 
          `/data/${folder}/Brother814_Needle_Bar_Mechanism.json` : 
          `/src/data/${folder}/Brother814_Needle_Bar_Mechanism.json`;
        
        const response = await fetch(testPath);
        // If response is 200, folder exists and has data
        if (response.ok) {
          existingFolders.push(folder);
          console.log(`Found existing folder: ${folder}`);
        } else {
          // Try any JSON file
          const altTestPath = isProd ? 
            `/data/${folder}/diagram.json` : 
            `/src/data/${folder}/diagram.json`;
          
          const altResponse = await fetch(altTestPath);
          if (altResponse.ok) {
            existingFolders.push(folder);
            console.log(`Found existing folder with alt file: ${folder}`);
          }
        }
      } catch (err) {
        console.log(`Error checking folder ${folder}:`, err);
      }
    }
    
    if (existingFolders.length > 0) {
      console.log("Found folders through testing:", existingFolders);
      return existingFolders;
    }
    
    // Ultimate fallback - return at least one known folder
    console.log("Falling back to known folder list");
    return ['test_Brother_814_Needle_Bar_Mechanism', 'test2_Brother_814_Needle_Bar_Mechanism', 'test3_Brother_814_Needle_Bar_Mechanism'];
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
    console.log(`Checking contents of folder: ${folderName}`);
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
    
    for (const bName of knownBaseNames) {
      // Check for JSON file with this basename
      try {
        const jsonResponse = await fetch(`/src/data/${folderName}/${bName}.json`);
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
    
    // If we found a valid baseName, check for matching CSV
    if (baseName) {
      try {
        const csvResponse = await fetch(`/src/data/${folderName}/${baseName}.csv`);
        hasCsv = csvResponse.ok;
        if (hasCsv) {
          console.log(`Found matching CSV file: ${baseName}.csv`);
        }
      } catch (err) {
        console.log(`Error checking for ${baseName}.csv:`, err);
      }
      
      // Check for matching image with various extensions
      const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
      for (const ext of imageExts) {
        try {
          const img = new Image();
          const imagePromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          
          img.src = `/src/data/${folderName}/${baseName}${ext}`;
          hasImage = await imagePromise;
          
          if (hasImage) {
            console.log(`Found image file: ${baseName}${ext} in ${folderName}`);
            break;
          }
        } catch (err) {
          console.log(`Error checking for ${baseName}${ext}:`, err);
        }
      }
      
      // If no direct image match, try common patterns
      if (!hasImage) {
        // For Brother 814, we know specific file names exist
        try {
          const img = new Image();
          const imagePromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          
          img.src = `/src/data/${folderName}/test_Brother814_Needle_Bar_Mechanism_2.png`;
          hasImage = await imagePromise;
          
          if (hasImage) {
            console.log(`Found alternate image file in ${folderName}`);
          }
        } catch (err) {
          console.log(`Error checking for alternate image:`, err);
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
