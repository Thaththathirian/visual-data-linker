/**
 * Utility functions for generating and managing thumbnails
 */

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

const defaultOptions: ThumbnailOptions = {
  width: 200,
  height: 200,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Creates a thumbnail from an image file using Canvas API
 * @param imageFile - The image file to create thumbnail from
 * @param options - Thumbnail generation options
 * @returns Promise<string> - Data URL of the generated thumbnail
 */
export const createThumbnail = async (
  imageFile: File,
  options: Partial<ThumbnailOptions> = {}
): Promise<string> => {
  const opts = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculate aspect ratio to maintain proportions
      const aspectRatio = img.width / img.height;
      let { width, height } = opts;
      
      if (aspectRatio > 1) {
        // Landscape image
        height = width / aspectRatio;
      } else {
        // Portrait image
        width = height * aspectRatio;
      }
      
      canvas.width = opts.width;
      canvas.height = opts.height;
      
      // Fill background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, opts.width, opts.height);
      
      // Center the image
      const x = (opts.width - width) / 2;
      const y = (opts.height - height) / 2;
      
      ctx.drawImage(img, x, y, width, height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL(`image/${opts.format}`, opts.quality);
      resolve(dataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Downloads a thumbnail as a file
 * @param dataUrl - Data URL of the thumbnail
 * @param filename - Name for the downloaded file
 */
export const downloadThumbnail = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Converts a data URL to a Blob
 * @param dataUrl - Data URL to convert
 * @returns Blob object
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * Resizes an image to fit within specified dimensions while maintaining aspect ratio
 * @param imageUrl - URL of the image to resize
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Promise<string> - Data URL of the resized image
 */
export const resizeImage = async (
  imageUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Calculate new dimensions
      let { width, height } = img;
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};





