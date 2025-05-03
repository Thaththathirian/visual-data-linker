
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
  
  // Try any image file that might exist in the folder
  try {
    // Look for alternate images in folder
    const imageFiles = ['test_Brother814_Needle_Bar_Mechanism_2.png', 'Brother814_Needle_Bar_Mechanism.jpg'];
    
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
    
    // First try with the provided fileName
    try {
      // Try to load from src/data folder using fetch
      // Use relative path to fetch resources in development
      const jsonPath = isProd ? 
        `/data/${folderName}/${baseName}.json` : 
        `/src/data/${folderName}/${baseName}.json`;
      
      console.log(`Attempting to load JSON from: ${jsonPath}`);
      const response = await fetch(jsonPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load JSON from ${jsonPath}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }
      
      jsonData = await response.json();
      console.log(`Successfully loaded JSON data for ${folderName}/${baseName}`);
    } catch (err) {
      console.log(`Error with first JSON attempt: ${err}`);
      
      // If that fails, try the Brother814_Needle_Bar_Mechanism.json directly
      if (folderName.includes('Brother_814') || folderName.includes('test_') || folderName.includes('test2_')) {
        try {
          const alternateBaseName = "Brother814_Needle_Bar_Mechanism";
          const alternatePath = isProd ? 
            `/data/${folderName}/${alternateBaseName}.json` : 
            `/src/data/${folderName}/${alternateBaseName}.json`;
          
          console.log(`Trying alternate JSON path: ${alternatePath}`);
          
          const response = await fetch(alternatePath);
          if (!response.ok) {
            throw new Error(`Failed to load alternate JSON from ${alternatePath}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Invalid content type for alternate: ${contentType}`);
          }
          
          jsonData = await response.json();
          console.log(`Successfully loaded alternate JSON data`);
        } catch (altErr) {
          console.error(`Failed alternate JSON attempt: ${altErr}`);
          return null;
        }
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
 * Dynamically detect and list folders in the data directory
 */
export const getAvailableFolders = async (): Promise<string[]> => {
  try {
    console.log("Starting folder detection");
    const isProd = import.meta.env.PROD;

    // For production, check if a folders.json exists in /data
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
    
    // Hardcoded list of known folders - this is our safety net
    const knownFolders = [
      'test_Brother_814_Needle_Bar_Mechanism',
      'test2_Brother_814_Needle_Bar_Mechanism'
    ];
    
    console.log("Using known folder list:", knownFolders);
    return knownFolders;
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
    
    // For Brother 814, we know specific file names exist
    if (folderName === 'test_Brother_814_Needle_Bar_Mechanism' || 
        folderName === 'test2_Brother_814_Needle_Bar_Mechanism') {
      baseName = 'Brother814_Needle_Bar_Mechanism';
      
      try {
        const jsonResponse = await fetch(`/src/data/${folderName}/${baseName}.json`);
        if (jsonResponse.ok) {
          hasJson = true;
          console.log(`Found JSON file: ${baseName}.json in folder ${folderName}`);
        }
      } catch (err) {
        console.log(`Error checking for ${baseName}.json:`, err);
      }
      
      try {
        const csvResponse = await fetch(`/src/data/${folderName}/${baseName}.csv`);
        hasCsv = csvResponse.ok;
        if (hasCsv) {
          console.log(`Found matching CSV file: ${baseName}.csv`);
        }
      } catch (err) {
        console.log(`Error checking for ${baseName}.csv:`, err);
      }
      
      // For images, check specific known file
      try {
        const img = new Image();
        const imagePromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        
        img.src = `/src/data/${folderName}/test_Brother814_Needle_Bar_Mechanism_2.png`;
        hasImage = await imagePromise;
        
        if (hasImage) {
          console.log(`Found image file in ${folderName}`);
        }
      } catch (err) {
        console.log(`Error checking for image:`, err);
      }
    }
    
    console.log(`Folder ${folderName} check results: JSON: ${hasJson}, CSV: ${hasCsv}, Image: ${hasImage}, Base name: ${baseName}`);
    return { hasJson, hasCsv, hasImage, baseName };
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};
