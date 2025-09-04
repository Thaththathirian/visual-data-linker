import { getAvailableFolders } from '@/utils/fileLoader';

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
export async function getDirectoryContents(folderPath: string): Promise<DirectoryContents[]> {
  if (!folderPath) {
    const { getRootFolderId, listSubfolders } = await import('@/utils/googleDrive');
    const rootId = getRootFolderId();
    if (!rootId) return [];
    const subs = await listSubfolders(rootId);
    return subs.map(s => ({ type: 'folder', name: s.name, path: s.name, itemCount: undefined }));
  }
  const { resolveFolderByPath, resolveFolderByNameUnderRoot, listSubfolders, listFilesInFolder } = await import('@/utils/googleDrive');
  const driveFolder = folderPath.includes('/')
    ? await resolveFolderByPath(folderPath)
    : await resolveFolderByNameUnderRoot(folderPath);
  if (!driveFolder) return [];
  const subfolders = await listSubfolders(driveFolder.id);
  const folderEntries: DirectoryContents[] = subfolders.map(sf => ({
    type: 'folder',
    name: sf.name,
    path: `${folderPath}/${sf.name}`.replace(/\/+/g, '/'),
    itemCount: undefined,
  }));
  const files = await listFilesInFolder(driveFolder.id);
  const fileEntries: DirectoryContents[] = files
    .filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
    .map(f => {
      const name = f.name;
      const ext = (name.split('.').pop() || '').toLowerCase();
      const type = ['json','csv','png','jpg','jpeg','webp','gif'].includes(ext) ? ext : 'file';
      return { type, name, path: `${folderPath}/${name}`.replace(/\/+/g, '/'), size: 0 } as DirectoryContents;
    });
  return [...folderEntries, ...fileEntries];
}

// Get file content by path (replaces /api/file)
export function getFileContent(filePath: string): string | null {
  return null;
}

// Get the complete folder structure
export async function getFolderStructure(): Promise<FolderItem[]> {
  const all = await getAvailableFolders();
  return all.map(p => ({ type: 'folder', name: p.split('/').pop() || p, path: p }));
}

// Search for files/folders by name
export async function searchItems(query: string): Promise<FolderItem[]> {
  const all = await getAvailableFolders();
  return all
    .filter(p => p.toLowerCase().includes(query.toLowerCase()))
    .map(p => ({ type: 'folder', name: p.split('/').pop() || p, path: p }));
}
