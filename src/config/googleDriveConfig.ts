// Google Drive Configuration
// This file contains the mapping between folder names and their file IDs
// Update this file with actual Google Drive file IDs when you have them

export interface GoogleDriveConfig {
  folderId: string;
  folders: {
    [folderName: string]: {
      jsonId: string;
      csvId: string;
      imageId: string;
    };
  };
}

// Prefer env var for folder id (set VITE_GOOGLE_DRIVE_FOLDER_ID in .env)
const ENV_FOLDER_ID = (import.meta as any)?.env?.VITE_GOOGLE_DRIVE_FOLDER_ID as string | undefined;

export const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  folderId: ENV_FOLDER_ID || "1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77",
  folders: {
    "Miscellaneous Cover": {
      jsonId: "YOUR_MISCELLANEOUS_COVER_JSON_FILE_ID_HERE",
      csvId: "YOUR_MISCELLANEOUS_COVER_CSV_FILE_ID_HERE",
      imageId: "YOUR_MISCELLANEOUS_COVER_PNG_FILE_ID_HERE"
    },
    "Thread Eyelet Parts": {
      jsonId: "YOUR_THREAD_EYELET_JSON_FILE_ID_HERE",
      csvId: "YOUR_THREAD_EYELET_CSV_FILE_ID_HERE", 
      imageId: "YOUR_THREAD_EYELET_PNG_FILE_ID_HERE"
    },
    "Needle Bar Mechanism": {
      jsonId: "YOUR_NEEDLE_BAR_JSON_FILE_ID_HERE",
      csvId: "YOUR_NEEDLE_BAR_CSV_FILE_ID_HERE",
      imageId: "YOUR_NEEDLE_BAR_PNG_FILE_ID_HERE"
    }
  }
};

export const getAvailableFolders = (): string[] => {
  return Object.keys(GOOGLE_DRIVE_CONFIG.folders);
};

export const getFileMapping = (folderName: string) => {
  return GOOGLE_DRIVE_CONFIG.folders[folderName];
};
