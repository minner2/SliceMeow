export interface ImageDimensions {
  width: number;
  height: number;
}

export interface GridConfig {
  rows: number;
  cols: number;
  // Positions are stored as percentages (0-100)
  horizontalLines: number[]; 
  verticalLines: number[];
  gutterSize: number; // Thickness of the cut line (pixels removed)
}

export interface Slice {
  id: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalIndex: number; // To keep order
  row: number;
  col: number;
}

export type ProcessingStatus = 'idle' | 'processing' | 'completed';
