/**
 * Utility functions for image compression on the frontend
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
}

/**
 * Validates if a file is an image
 * @param file - The file to validate
 * @returns boolean - True if the file is an image
 */
export const isValidImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Gets the file size in a human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Checks if an image file needs compression based on size
 * @param file - The image file to check
 * @param maxSizeMB - Maximum size in MB (default: 1MB)
 * @returns boolean - True if compression is needed
 */
export const needsCompression = (file: File, maxSizeMB: number = 1): boolean => {
  return file.size > maxSizeMB * 1024 * 1024;
};

/**
 * Compresses an image file to reduce its size
 * @param file - The original image file
 * @param options - Compression options
 * @returns Promise<File> - The compressed image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  // Validate input
  if (!isValidImage(file)) {
    throw new Error('File is not a valid image');
  }

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
}; 