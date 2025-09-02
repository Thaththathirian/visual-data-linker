const DRIVE_API_KEY = import.meta.env.VITE_DRIVE_API_KEY as string | undefined;
const DRIVE_ROOT_FOLDER_ID = import.meta.env.VITE_DRIVE_ROOT_FOLDER_ID as string | undefined;

export const isDriveEnabled = (): boolean => {
  const enabled = !!DRIVE_API_KEY && !!DRIVE_ROOT_FOLDER_ID;
  if (enabled && DRIVE_API_KEY && /BEGIN\s+PRIVATE\s+KEY/i.test(DRIVE_API_KEY)) {
    console.error('[Drive] Misconfigured VITE_DRIVE_API_KEY: looks like a service account private key. Use a browser API key.');
    return false;
  }
  return enabled;
};

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
};

const driveFetch = async (url: string): Promise<Response> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Drive request failed: ${response.status} ${response.statusText}`);
  return response;
};

export const getDriveDownloadUrl = (fileId: string): string => {
  if (!DRIVE_API_KEY) return '';
  return `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?alt=media&key=${encodeURIComponent(DRIVE_API_KEY)}`;
};

export const listSubfolders = async (parentFolderId: string): Promise<DriveFile[]> => {
  const q = encodeURIComponent(`'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const url = `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name,mimeType)&key=${encodeURIComponent(DRIVE_API_KEY!)}`;
  const res = await driveFetch(url);
  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
};

export const findChildFolderByName = async (parentFolderId: string, name: string): Promise<DriveFile | null> => {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const targetNorm = normalize(name);
  // First try exact API filter for speed
  try {
    const safeName = name.replace(/'/g, "\\'");
    const q = encodeURIComponent(`'${parentFolderId}' in parents and name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const url = `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name,mimeType)&key=${encodeURIComponent(DRIVE_API_KEY!)}`;
    const res = await driveFetch(url);
    const data = await res.json();
    if (data.files && data.files[0]) return data.files[0];
  } catch {
    // fall through to flexible scan
  }
  // Flexible: list and match by normalized name
  try {
    const all = await listSubfolders(parentFolderId);
    const match = all.find(f => normalize(f.name) === targetNorm);
    if (match) return match;
  } catch {}
  console.warn('[Drive] findChildFolderByName: not found', { parentFolderId, requested: name });
  return null;
};

export const listFilesInFolder = async (folderId: string): Promise<DriveFile[]> => {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const url = `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name,mimeType)&key=${encodeURIComponent(DRIVE_API_KEY!)}`;
  const res = await driveFetch(url);
  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
};

export const resolveFolderByNameUnderRoot = async (folderName: string): Promise<DriveFile | null> => {
  if (!DRIVE_ROOT_FOLDER_ID) return null;
  return findChildFolderByName(DRIVE_ROOT_FOLDER_ID, folderName);
};

export const resolveFolderByPath = async (path: string): Promise<DriveFile | null> => {
  if (!DRIVE_ROOT_FOLDER_ID) return null;
  const segments = path.split('/').filter(Boolean);
  let currentParentId = DRIVE_ROOT_FOLDER_ID;
  let currentFolder: DriveFile | null = null;
  for (const seg of segments) {
    const next = await findChildFolderByName(currentParentId, seg);
    if (!next) return null;
    currentFolder = next;
    currentParentId = next.id;
  }
  return currentFolder;
};

export const listAllSubfoldersRecursive = async (parentFolderId: string, parentPath: string = ''): Promise<string[]> => {
  const result: string[] = [];
  const children = await listSubfolders(parentFolderId);
  for (const child of children) {
    const childPath = parentPath ? `${parentPath}/${child.name}` : child.name;
    result.push(childPath);
    const sub = await listAllSubfoldersRecursive(child.id, childPath);
    result.push(...sub);
  }
  return result;
};

export const fetchJsonInFolderByCandidates = async (folderId: string, candidateNames: string[]): Promise<any | null> => {
  for (const name of candidateNames) {
    const safeName = name.replace(/'/g, "\\'");
    const q = encodeURIComponent(`'${folderId}' in parents and name = '${safeName}.json' and trashed = false`);
    const url = `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name)&key=${encodeURIComponent(DRIVE_API_KEY!)}`;
    const searchRes = await driveFetch(url);
    const searchData = await searchRes.json();
    const file = searchData.files && searchData.files[0];
    if (file) {
      const downloadUrl = getDriveDownloadUrl(file.id);
      const res = await driveFetch(downloadUrl);
      const text = await res.text();
      try {
        const json = JSON.parse(text.trim().replace(/^\uFEFF/, ''));
        return json;
      } catch (_) {
        // continue
      }
    }
  }
  // Flexible fallback: list files and match ignoring extra spaces and optional -coordinates
  try {
    const list = await listFilesInFolder(folderId);
    const jsonFiles = list.filter(f => /\.json$/i.test(f.name));
    const normalize = (s: string) => s
      .replace(/\.json$/i, '')
      .replace(/-coordinates$/i, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const normalizedCandidates = new Set(candidateNames.map(c => normalize(c)));
    const matched = jsonFiles.find(f => normalizedCandidates.has(normalize(f.name)));
    if (matched) {
      const res = await driveFetch(getDriveDownloadUrl(matched.id));
      const text = await res.text();
      try {
        const json = JSON.parse(text.trim().replace(/^\uFEFF/, ''));
        return json;
      } catch {
        return null;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const fetchCsvRowsInFolder = async (folderId: string, baseName: string): Promise<string> => {
  const safeBase = baseName.replace(/'/g, "\\'");
  const q = encodeURIComponent(`'${folderId}' in parents and name = '${safeBase}.csv' and trashed = false`);
  const url = `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name)&key=${encodeURIComponent(DRIVE_API_KEY!)}`;
  const searchRes = await driveFetch(url);
  const searchData = await searchRes.json();
  const file = searchData.files && searchData.files[0];
  if (!file) return '';
  const downloadUrl = getDriveDownloadUrl(file.id);
  const res = await driveFetch(downloadUrl);
  return await res.text();
};

export const findImageFileInFolder = async (folderId: string, baseName: string): Promise<string | null> => {
  const exts = ['png','jpg','jpeg','webp','gif'];
  const safeBase = baseName.replace(/'/g, "\\'");
  for (const ext of exts) {
    const q = encodeURIComponent(`'${folderId}' in parents and name = '${safeBase}.${ext}' and trashed = false`);
    const url = `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name)&key=${encodeURIComponent(DRIVE_API_KEY!)}`;
    const searchRes = await driveFetch(url);
    const searchData = await searchRes.json();
    const file = searchData.files && searchData.files[0];
    if (file) return getDriveDownloadUrl(file.id);
  }
  return null;
};

export const getRootFolderId = (): string | undefined => DRIVE_ROOT_FOLDER_ID;


