import { Slice } from '../types';

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Helper to convert a canvas to a blob/slice
const canvasToSlice = async (canvas: HTMLCanvasElement, index: number, row: number, col: number): Promise<Slice> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Failed to create blob");
      resolve({
        id: Math.random().toString(36).substring(7),
        blob,
        url: URL.createObjectURL(blob),
        width: canvas.width,
        height: canvas.height,
        originalIndex: index,
        row,
        col
      });
    }, 'image/png');
  });
};

export const generateSlices = async (
  imageSrc: string,
  hLines: number[], // Percentages 0-100
  vLines: number[],  // Percentages 0-100
  gutterSize: number = 0 // Pixels to skip between slices
): Promise<Slice[]> => {
  const img = await loadImage(imageSrc);
  const slices: Slice[] = [];
  
  // Sort lines and add 0 and 100 to edges to form complete segments
  const sortedH = [0, ...[...hLines].sort((a, b) => a - b), 100];
  const sortedV = [0, ...[...vLines].sort((a, b) => a - b), 100];

  let sliceIndex = 0;

  for (let r = 0; r < sortedH.length - 1; r++) {
    for (let c = 0; c < sortedV.length - 1; c++) {
      const y1Pc = sortedH[r];
      const y2Pc = sortedH[r + 1];
      const x1Pc = sortedV[c];
      const x2Pc = sortedV[c + 1];

      // Calculate base pixel positions (center of the cut line)
      const xCenter1 = Math.floor((x1Pc / 100) * img.naturalWidth);
      const xCenter2 = Math.floor((x2Pc / 100) * img.naturalWidth);
      const yCenter1 = Math.floor((y1Pc / 100) * img.naturalHeight);
      const yCenter2 = Math.floor((y2Pc / 100) * img.naturalHeight);

      // Apply gutter logic
      // If it's the first edge (0%), no gutter on the left/top side.
      // If it's an inner line, start = center + half_gutter.
      // If it's the last edge (100%), no gutter on the right/bottom side.
      // If it's an inner line, end = center - half_gutter.

      const xStart = (c === 0) ? 0 : xCenter1 + Math.ceil(gutterSize / 2);
      const xEnd = (c === sortedV.length - 2) ? img.naturalWidth : xCenter2 - Math.floor(gutterSize / 2);
      
      const yStart = (r === 0) ? 0 : yCenter1 + Math.ceil(gutterSize / 2);
      const yEnd = (r === sortedH.length - 2) ? img.naturalHeight : yCenter2 - Math.floor(gutterSize / 2);

      const w = xEnd - xStart;
      const h = yEnd - yStart;

      if (w > 0 && h > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, xStart, yStart, w, h, 0, 0, w, h);
          slices.push(await canvasToSlice(canvas, sliceIndex, r, c));
        }
      }
      sliceIndex++;
    }
  }
  return slices;
};

export const manualCropSlice = async (slice: Slice, crop: {x: number, y: number, w: number, h: number}): Promise<Slice> => {
   const img = await loadImage(slice.url);
   const canvas = document.createElement('canvas');
   canvas.width = crop.w;
   canvas.height = crop.h;
   const ctx = canvas.getContext('2d');
   if(!ctx) return slice;
   
   ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
   return await canvasToSlice(canvas, slice.originalIndex, slice.row, slice.col);
}

// Split a slice into two based on a percentage position (0-100)
// axis: 'horizontal' (cut along Y axis, result is Top/Bottom) | 'vertical' (cut along X axis, result is Left/Right)
export const splitSlice = async (slice: Slice, percentage: number, axis: 'horizontal' | 'vertical'): Promise<[Slice, Slice]> => {
  const img = await loadImage(slice.url);
  const cutPos = axis === 'horizontal' 
    ? Math.floor((percentage / 100) * img.naturalHeight)
    : Math.floor((percentage / 100) * img.naturalWidth);

  // Validation
  if (cutPos <= 0 || (axis === 'horizontal' && cutPos >= img.naturalHeight) || (axis === 'vertical' && cutPos >= img.naturalWidth)) {
    return [slice, slice]; 
  }

  // Canvas 1
  const w1 = axis === 'horizontal' ? img.naturalWidth : cutPos;
  const h1 = axis === 'horizontal' ? cutPos : img.naturalHeight;
  const c1 = document.createElement('canvas');
  c1.width = w1;
  c1.height = h1;
  c1.getContext('2d')?.drawImage(img, 0, 0, w1, h1, 0, 0, w1, h1);
  const s1 = await canvasToSlice(c1, slice.originalIndex, slice.row, slice.col);

  // Canvas 2
  const x2 = axis === 'horizontal' ? 0 : cutPos;
  const y2 = axis === 'horizontal' ? cutPos : 0;
  const w2 = axis === 'horizontal' ? img.naturalWidth : img.naturalWidth - cutPos;
  const h2 = axis === 'horizontal' ? img.naturalHeight - cutPos : img.naturalHeight;
  const c2 = document.createElement('canvas');
  c2.width = w2;
  c2.height = h2;
  c2.getContext('2d')?.drawImage(img, x2, y2, w2, h2, 0, 0, w2, h2);
  const s2 = await canvasToSlice(c2, slice.originalIndex, slice.row, slice.col);

  return [s1, s2];
};
