export interface IndexItem {
  id: string;
  asset_id: string;
  category: string;
  subcategory: string;
  category_path?: string;
  file_name: string;
  thumbnail_path: string;
  image_path: string;
  coordinates_path: string;
  data_path: string;
  description: string;
  related_ids?: string[];
}

export interface CategoryGroup {
  name: string;
  subcategories: string[];
  items: IndexItem[];
}

export interface CategoryNode {
  name: string;
  children: Map<string, CategoryNode>;
  items: IndexItem[];
}

export const readIndexFromDrive = async (): Promise<IndexItem[]> => {
  const rootFolderId = import.meta.env.VITE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('VITE_DRIVE_ROOT_FOLDER_ID environment variable is required. Please set it in your .env file.');
  }

  const { listFilesInFolder, getDriveDownloadUrl } = await import('./googleDrive');
  const files = await listFilesInFolder(rootFolderId);
  const indexFile = files.find(file => file.name.toLowerCase() === 'index.csv');
  if (!indexFile) {
    throw new Error('No index.csv file found in the root folder. Please upload an index.csv file to your Google Drive root folder.');
  }

  const downloadUrl = getDriveDownloadUrl(indexFile.id);
  if (!downloadUrl) {
    throw new Error('Failed to generate download URL. Please check your VITE_DRIVE_API_KEY.');
  }

  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Failed to fetch index.csv: ${res.status} ${res.statusText}`);
  const csvContent = await res.text();
  if (!csvContent.trim()) throw new Error('index.csv file is empty. Please add data to the file.');

  const { parse } = await import('papaparse');
  const normalizeHeader = (h: string) => String(h || '').trim();
  const raw = parse(csvContent, { header: false, skipEmptyLines: false });
  const rows: string[][] = (raw.data as any[])
    .filter(r => Array.isArray(r))
    .map(r => r.map((v: any) => (v == null ? '' : String(v))));

  const hasAssetPaths = (headers: string[]) => {
    const hs = headers.map(h => normalizeHeader(h).toLowerCase());
    const hasCoords = hs.includes('coordinates_path');
    const hasData = hs.includes('data_path');
    const hasAssetId = hs.includes('asset_id') || hs.includes('assetid') || hs.includes('id');
    console.log('hasAssetPaths check:', { headers: hs, hasCoords, hasData, hasAssetId });
    return hasCoords && hasData && hasAssetId;
  };
  const hasMetadata = (headers: string[]) => {
    const hs = headers.map(h => normalizeHeader(h).toLowerCase());
    const required = ['category', 'subcategory'];
    const ok = required.every(k => hs.includes(k));
    const hasIdRef = hs.includes('asset_id') || hs.includes('assetid') || hs.includes('ref_id') || hs.includes('refid') || hs.includes('id');
    console.log('hasMetadata check:', { headers: hs, required, ok, hasIdRef });
    return ok && hasIdRef;
  };

  let header1Index = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 0 || r.every(c => c === '')) continue;
    if (hasAssetPaths(r)) { header1Index = i; break; }
  }

  let header2Index = -1;
  if (header1Index >= 0) {
    for (let i = header1Index + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every(c => c === '')) continue;
      if (hasMetadata(r)) { header2Index = i; break; }
    }
  }

  if (!(header1Index >= 0 && header2Index > header1Index)) {
    console.error('CSV Parsing Error:', {
      totalRows: rows.length,
      header1Index,
      header2Index,
      header1: header1Index >= 0 ? rows[header1Index] : null,
      header2: header2Index >= 0 ? rows[header2Index] : null
    });
    throw new Error('index.csv must be two tables: asset map (with id, coordinates_path, data_path, optional thumbnail_path/image_path) followed by metadata (with asset_id).');
  }

  const headers1 = rows[header1Index].map(normalizeHeader);
  const idIdx = headers1.findIndex(h => ['id', 'asset_id', 'assetId'].includes(h));
  const fileNameIdx = headers1.findIndex(h => h.toLowerCase() === 'file_name');
  const descIdx = headers1.findIndex(h => h.toLowerCase() === 'description');
  const imgIdx = headers1.findIndex(h => h.toLowerCase() === 'image_path');
  const coordsIdx = headers1.findIndex(h => h.toLowerCase() === 'coordinates_path');
  const dataIdx = headers1.findIndex(h => h.toLowerCase() === 'data_path');
  const thumbIdx = headers1.findIndex(h => h.toLowerCase() === 'thumbnail_path');
  if (idIdx < 0) {
    throw new Error('First table must include an id column (id/asset_id/assetId).');
  }

  const pathMap = new Map<string, { file_name?: string; description?: string; image_path?: string; coordinates?: string; data?: string; thumbnail_path?: string }>();
  for (let i = header1Index + 1; i < header2Index; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === '')) continue;
    const idVal = (r[idIdx] || '').trim();
    if (!idVal) continue;
    pathMap.set(idVal, {
      file_name: fileNameIdx >= 0 ? (r[fileNameIdx] || '').trim() : undefined,
      description: descIdx >= 0 ? (r[descIdx] || '').trim() : undefined,
      image_path: imgIdx >= 0 ? (r[imgIdx] || '').trim() : undefined,
      coordinates: coordsIdx >= 0 ? (r[coordsIdx] || '').trim() : undefined,
      data: dataIdx >= 0 ? (r[dataIdx] || '').trim() : undefined,
      thumbnail_path: thumbIdx >= 0 ? (r[thumbIdx] || '').trim() : undefined,
    });
  }

  const headers2 = rows[header2Index].map(normalizeHeader);
  const col = (name: string) => headers2.findIndex(h => h.toLowerCase() === name);
  const categoryIdx = col('category');
  const subcategoryIdx = col('subcategory');
  const relatedIdx = (() => {
    const names = ['related_ids','related','related id','related ids'];
    for (const n of names) {
      const i = headers2.findIndex(h => h.toLowerCase() === n);
      if (i >= 0) return i;
    }
    return -1;
  })();
  const categoryPathIdx = col('category_path');
  const refIdx = (() => {
    const candidates = ['asset_id','assetid','ref_id','refid','id'];
    for (const c of candidates) {
      const idx = headers2.findIndex(h => h.toLowerCase() === c);
      if (idx >= 0) return idx;
    }
    return -1;
  })();
  if (categoryIdx < 0 || subcategoryIdx < 0 || refIdx < 0) {
    throw new Error('Second table must include category, subcategory and an asset_id reference column.');
  }

  const items: IndexItem[] = [];
  for (let i = header2Index + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === '')) continue;
    const refId = (r[refIdx] || '').trim();
    const paths = refId ? pathMap.get(refId) : undefined;
    items.push({
      id: (i - header2Index - 1).toString(),
      asset_id: refId,
      category: (r[categoryIdx] || 'Uncategorized') as string,
      subcategory: (r[subcategoryIdx] || '') as string,
      category_path: categoryPathIdx >= 0 ? (r[categoryPathIdx] || undefined) : undefined,
      file_name: (paths && paths.file_name) || '',
      thumbnail_path: (paths && paths.thumbnail_path) || '',
      image_path: (paths && paths.image_path) || '',
      coordinates_path: (paths && paths.coordinates) || '',
      data_path: (paths && paths.data) || '',
      description: (paths && paths.description) || '',
      related_ids: relatedIdx >= 0 && r[relatedIdx]
        ? String(r[relatedIdx])
            .replace(/^[\[\(\{\s]+|[\]\)\}\s]+$/g, '')
            .split(/[,;\s]+/)
            .map(s => s.trim())
            .filter(Boolean)
        : undefined
    });
  }

  return items;
};

export const groupByCategory = (items: IndexItem[]): CategoryGroup[] => {
  const categoryMap = new Map<string, CategoryGroup>();
  items.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, { name: item.category, subcategories: [], items: [] });
    }
    const category = categoryMap.get(item.category)!;
    if (item.subcategory && !category.subcategories.includes(item.subcategory)) {
      category.subcategories.push(item.subcategory);
    }
    category.items.push(item);
  });
  return Array.from(categoryMap.values());
};

export const buildCategoryTree = (items: IndexItem[]): CategoryNode => {
  const root: CategoryNode = { name: 'root', children: new Map(), items: [] };
  items.forEach((item) => {
    const pathLevels = (item.category_path
      ? String(item.category_path).split('>').map((s: string) => s.trim()).filter(Boolean)
      : [item.category, item.subcategory].filter(Boolean)) as string[];
    let current = root;
    for (const level of pathLevels) {
      if (!current.children.has(level)) {
        current.children.set(level, { name: level, children: new Map(), items: [] });
      }
      current = current.children.get(level)!;
    }
    current.items.push(item);
  });
  return root;
};

export const getItemsByCategory = (items: IndexItem[], category: string): IndexItem[] => {
  return items.filter(item => item.category === category);
};

export const getItemsBySubcategory = (items: IndexItem[], category: string, subcategory: string): IndexItem[] => {
  return items.filter(item => item.category === category && item.subcategory === subcategory);
};



