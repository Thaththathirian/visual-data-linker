
import * as XLSX from "xlsx";
import { TableRow, ImageData } from "@/types";

/**
 * Gets the appropriate table path based on environment
 */
export const getTablePath = (fileName: string) => {
  const isProd = import.meta.env.PROD;
  return isProd ? `/tables/${fileName}` : `/src/data/tables/${fileName}`;
};

/**
 * Gets the appropriate image path
 */
export const getImagePath = (fileName: string) => {
  return `/images/${fileName}`;
};

/**
 * Dynamically parse XLSX table data
 */
export const parseXLSXTable = async (fileName: string): Promise<TableRow[]> => {
  try {
    const filePath = getTablePath(fileName);
    console.log(`Fetching XLSX file from: ${filePath}`);

    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(
        `Failed to load table: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to load table from ${filePath}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    return json.map((row, idx) => {
      const tableRow: TableRow = {
        id: idx + 1,
        number: String(row["Number"] || ""),
        name: String(row["Qty"] || ""),
        description: String(row["Description"] || ""),
        partNumber: String(row["Part No."] || ""),
      };
      return tableRow;
    });
  } catch (err) {
    console.error("Error in parseXLSXTable:", err);
    return [];
  }
};

/**
 * Load image data (JSON) dynamically
 */
export const loadImageData = async (imageName: string): Promise<ImageData | null> => {
  try {
    const module = await import(`../data/images/${imageName}.json`);
    return module.default as ImageData;
  } catch (err) {
    console.error(`Error loading image data for ${imageName}:`, err);
    return null;
  }
};

/**
 * Fetches all available image data files
 */
export const getAvailableImageFiles = async (): Promise<string[]> => {
  try {
    // In a real-world scenario, you might use an API endpoint
    // to retrieve a list of available files
    // For now, we'll use a static import.meta.glob to get all JSON files
    const imageModules = import.meta.glob('../data/images/*.json');
    const imageFiles: string[] = [];
    
    for (const path in imageModules) {
      if (path.endsWith('.json')) {
        // Extract the filename without extension
        const match = path.match(/\/([^/]+)\.json$/);
        if (match && match[1]) {
          imageFiles.push(match[1]);
        }
      }
    }
    
    return imageFiles;
  } catch (err) {
    console.error('Error getting available image files:', err);
    return [];
  }
};
