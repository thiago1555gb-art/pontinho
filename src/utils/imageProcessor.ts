/**
 * High-quality client-side image processor for player avatars.
 * Crops the image to a perfect square from the center and resizes it to exactly 512x512 pixels
 * using HTML5 Canvas with high-quality smoothing enabled.
 */
export async function processAvatarImage(file: File): Promise<{ blob: Blob; width: number; height: number; originalSize: number; processedSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Create canvas for high-quality cropping and resizing
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get 2D context from canvas"));
        return;
      }
      
      // Target size is 512x512 for crisp Retina display rendering
      const targetSize = 512;
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      // Calculate cropping coordinates (center crop)
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = originalWidth;
      let sourceHeight = originalHeight;
      
      if (originalWidth > originalHeight) {
        // Landscape: crop sides
        sourceWidth = originalHeight;
        sourceX = (originalWidth - originalHeight) / 2;
      } else if (originalHeight > originalWidth) {
        // Portrait: crop top/bottom
        sourceHeight = originalWidth;
        sourceY = (originalHeight - originalWidth) / 2;
      }
      
      // Draw cropped and resized image onto canvas
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetSize,
        targetSize
      );
      
      // Convert canvas to high-quality JPEG blob (quality 0.92 is the sweet spot for crispness and size)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("[Image Processor] Processing complete:", {
              originalDimensions: `${originalWidth}x${originalHeight}`,
              croppedDimensions: `${targetSize}x${targetSize}`,
              originalSizeKB: (file.size / 1024).toFixed(1) + " KB",
              processedSizeKB: (blob.size / 1024).toFixed(1) + " KB",
            });
            
            resolve({
              blob,
              width: targetSize,
              height: targetSize,
              originalSize: file.size,
              processedSize: blob.size,
            });
          } else {
            reject(new Error("Canvas toBlob returned null"));
          }
        },
        "image/jpeg",
        0.92
      );
    };
    
    img.onerror = (err) => {
      reject(err);
    };
  });
}