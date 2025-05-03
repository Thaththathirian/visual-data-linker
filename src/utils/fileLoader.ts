
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
    // Look for any image in that folder
    const response = await fetch(`/src/data/${folderName}/`);
    if (response.ok) {
      const html = await response.text();
      
      // Use regex to find image files in the directory listing
      const imageRegex = new RegExp(`href="([^"]+\\.(${extensions.map(ext => ext.substring(1)).join('|')}))"`);
      const match = html.match(imageRegex);
      
      if (match && match[1]) {
        const imgPath = `/src/data/${folderName}/${match[1]}`;
        console.log(`Found alternative image in folder: ${imgPath}`);
        return imgPath;
      }
    }
  } catch (err) {
    console.log('Error finding alternative image:', err);
  }
  
  // Final fallback - try absolute URLs
  const origin = window.location.origin;
  for (const ext of extensions) {
    const url = `${origin}/src/data/${folderName}/${baseName}${ext}`;
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

    // Try to scan src/data directory in development
    try {
      console.log("Attempting to scan data directory");
      
      // Attempt to fetch the src/data directory listing
      const response = await fetch('/src/data/');
      if (response.ok) {
        const html = await response.text();
        
        // Use regex to extract directory names
        const dirRegex = /href="([^"\/]+)\/?"/g;
        const matches = html.matchAll(dirRegex);
        
        const folders: string[] = [];
        for (const match of matches) {
          if (match[1] && !match[1].includes('.')) { // Exclude file names
            folders.push(match[1]);
          }
        }
        
        if (folders.length > 0) {
          console.log("Found folders via directory scan:", folders);
          return folders;
        }
      }
    } catch (err) {
      console.log("Directory scan didn't work:", err);
    }
    
    // Try to detect folders by probing for known folders
    // This is a fallback approach when we can't list directories
    const knownPrefixes = ['test_', 'test2_', ''];
    const knownBaseNames = ['Brother_814_Needle_Bar_Mechanism'];
    
    const potentialFolders: string[] = [];
    
    // Generate potential folder names based on known patterns
    for (const prefix of knownPrefixes) {
      for (const baseName of knownBaseNames) {
        potentialFolders.push(`${prefix}${baseName}`);
      }
    }
    
    // Add in any custom folder names to check
    potentialFolders.push(...['diagram_data', 'mechanism_diagrams', 'sewing_machine_parts']);
    
    console.log("Checking potential folders:", potentialFolders);
    
    // Check each potential folder to see if it exists
    const existingFolders: string[] = [];
    
    for (const folder of potentialFolders) {
      try {
        const response = await fetch(`/src/data/${folder}/`);
        if (response.ok) {
          console.log(`Folder found: ${folder}`);
          existingFolders.push(folder);
        }
      } catch (err) {
        // Folder doesn't exist or can't be accessed
      }
    }
    
    // Case-by-case detection as last resort
    try {
      // Special case for Brother 814 folder - we know it exists
      const response = await fetch('/src/data/test_Brother_814_Needle_Bar_Mechanism/');
      if (response.ok) {
        if (!existingFolders.includes('test_Brother_814_Needle_Bar_Mechanism')) {
          existingFolders.push('test_Brother_814_Needle_Bar_Mechanism');
        }
      }
    } catch (err) {
      // Folder doesn't exist or can't be accessed
    }
    
    try {
      // Check for test2 folder
      const response = await fetch('/src/data/test2_Brother_814_Needle_Bar_Mechanism/');
      if (response.ok) {
        if (!existingFolders.includes('test2_Brother_814_Needle_Bar_Mechanism')) {
          existingFolders.push('test2_Brother_814_Needle_Bar_Mechanism');
        }
      }
    } catch (err) {
      // Folder doesn't exist or can't be accessed
    }
    
    if (existingFolders.length > 0) {
      console.log("Found existing folders:", existingFolders);
      return existingFolders;
    }

    // Final fallback to hardcoded list
    console.log("Using fallback folder list");
    return ['test_Brother_814_Needle_Bar_Mechanism', 'test2_Brother_814_Needle_Bar_Mechanism'];
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
    const isProd = import.meta.env.PROD;
    let baseName = null;
    let hasJson = false;
    let hasCsv = false;
    let hasImage = false;
    
    // First, try to find a JSON file using common naming patterns
    const commonJsonNames = [
      `${folderName}`, // Same as folder name
      `${folderName.replace(/^test_/, '')}`, // Without 'test_' prefix
      `${folderName.replace(/^test2_/, '')}` // Without 'test2_' prefix
    ];
    
    // For Brother 814, we know specific file names might exist
    if (folderName === 'test_Brother_814_Needle_Bar_Mechanism' || 
        folderName === 'test2_Brother_814_Needle_Bar_Mechanism') {
      commonJsonNames.push('Brother814_Needle_Bar_Mechanism');
    }
    
    for (const name of commonJsonNames) {
      try {
        const jsonResponse = await fetch(`/src/data/${folderName}/${name}.json`);
        if (jsonResponse.ok) {
          hasJson = true;
          baseName = name;
          console.log(`Found JSON file: ${name}.json in folder ${folderName}`);
          break;
        }
      } catch (err) {
        // Continue to next name
      }
    }
    
    // If no match found, try a more generic approach to find any JSON file
    if (!baseName) {
      try {
        const response = await fetch(`/src/data/${folderName}/`);
        if (response.ok) {
          const html = await response.text();
          
          // Look for any JSON file
          const jsonRegex = /href="([^"]+\.json)"/;
          const match = html.match(jsonRegex);
          
          if (match && match[1]) {
            const jsonFileName = match[1];
            baseName = jsonFileName.replace(/\.json$/, '');
            hasJson = true;
            console.log(`Found JSON file through directory scan: ${jsonFileName}`);
          }
        }
      } catch (err) {
        console.log('Error searching for JSON file:', err);
      }
    }
    
    // Check for CSV file with the same base name if we found a JSON
    if (baseName) {
      try {
        const csvResponse = await fetch(`/src/data/${folderName}/${baseName}.csv`);
        hasCsv = csvResponse.ok;
        if (hasCsv) {
          console.log(`Found matching CSV file: ${baseName}.csv`);
        }
      } catch (err) {
        // Try to find any CSV file in the folder
        try {
          const response = await fetch(`/src/data/${folderName}/`);
          if (response.ok) {
            const html = await response.text();
            
            // Look for any CSV file
            const csvRegex = /href="([^"]+\.csv)"/;
            const match = html.match(csvRegex);
            
            if (match && match[1]) {
              hasCsv = true;
              console.log(`Found CSV file through directory scan: ${match[1]}`);
            }
          }
        } catch (searchErr) {
          console.log('Error searching for CSV file:', searchErr);
        }
      }
      
      // For images, we need to check if any image file exists
      const imagePath = await getImagePath(folderName, baseName);
      hasImage = imagePath !== null && !imagePath.includes('placeholder');
      if (hasImage) {
        console.log(`Found image file for: ${baseName}`);
      }
    }
    
    console.log(`Folder ${folderName} check results: JSON: ${hasJson}, CSV: ${hasCsv}, Image: ${hasImage}, Base name: ${baseName}`);
    return { hasJson, hasCsv, hasImage, baseName };
  } catch (err) {
    console.error(`Error checking folder contents for ${folderName}:`, err);
    return { hasJson: false, hasCsv: false, hasImage: false, baseName: null };
  }
};
