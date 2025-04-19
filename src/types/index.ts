
export interface Coordinate {
  id: number;
  x: number;
  y: number;
  number: string;
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

export interface SearchResult {
  type: 'image' | 'part';
  name: string;
  path: string;
}
