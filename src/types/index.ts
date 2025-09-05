
export interface Coordinate {
  id: string;
  x: number;
  y: number;
  partNumber: string;
  description: string;
}

export interface ImageData {
  imageName: string;
  coordinates: Coordinate[];
}

export interface TableRow {
  id: number;
  number: string;
  name: string;
  description: string;
  partNumber: string;
}

export interface ProductItem {
  brand: string;
  model: string;
  category: string;
  type: string;
  product_path: string;
  product_name: string;
  product_description: string;
  relative_products: string;
}

export interface SearchResult {
  type: 'image' | 'part';
  name: string;
  path: string;
}

export interface FolderItem {
  type: 'folder';
  name: string;
  itemCount: number;
  path: string;
}

export interface FileItem {
  type: 'json' | 'csv' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif';
  name: string;
  path: string;
  size?: number;
  hasCoordinates?: boolean;
}

export interface FolderContents {
  folders: FolderItem[];
  files: FileItem[];
}
