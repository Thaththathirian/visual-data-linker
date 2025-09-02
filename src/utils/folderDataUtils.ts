import folderStructure from '../data/folderStructure.json';

export interface FolderItem {
  type: 'folder' | string;
  name: string;
  path: string;
  itemCount?: number;
  children?: FolderItem[];
  extension?: string;
}

export interface DirectoryContents {
  type: 'folder' | string;
  name: string;
  path: string;
  itemCount?: number;
  size?: number;
}

// Get folder contents by path (replaces /api/directory)
export function getDirectoryContents(folderPath: string): DirectoryContents[] {
  if (!folderPath) {
    return folderStructure;
  }

  const pathParts = folderPath.split('/').filter(Boolean);
  let currentLevel: FolderItem[] = folderStructure;

  // Navigate to the requested folder
  for (const part of pathParts) {
    const folder = currentLevel.find(item => item.type === 'folder' && item.name === part);
    if (!folder || !folder.children) {
      return [];
    }
    currentLevel = folder.children;
  }

  // Convert to the same format as the old API
  return currentLevel.map(item => {
    if (item.type === 'folder') {
      return {
        type: 'folder',
        name: item.name,
        path: item.path,
        itemCount: item.itemCount
      };
    } else {
      return {
        type: item.extension?.replace('.', '') || 'file',
        name: item.name,
        path: item.path,
        size: 0 // We don't have size info in the generated data
      };
    }
  });
}

// Get file content by path (replaces /api/file)
export function getFileContent(filePath: string): string | null {
  // For now, we'll return null since we're not storing file contents in the JSON
  // You can extend this to read actual files if needed
  return null;
}

// Get the complete folder structure
export function getFolderStructure(): FolderItem[] {
  return folderStructure;
}

// Search for files/folders by name
export function searchItems(query: string): FolderItem[] {
  const results: FolderItem[] = [];
  
  function searchRecursive(items: FolderItem[], query: string) {
    for (const item of items) {
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
      if (item.children) {
        searchRecursive(item.children, query);
      }
    }
  }
  
  searchRecursive(folderStructure, query);
  return results;
}
