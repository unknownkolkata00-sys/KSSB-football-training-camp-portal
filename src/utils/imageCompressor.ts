export function compressImageFile(
  file: File | string,
  maxDimension = 800,
  initialQuality = 0.75,
  maxByteSize = 500000 // 500 KB safe limit for Firestore 1MB doc ceiling
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (srcUrl: string) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(srcUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Progressively reduce quality if string exceeds target limit
        while (dataUrl.length > maxByteSize && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // If still over limit, downscale resolution further
        if (dataUrl.length > maxByteSize) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(width * 0.7);
          smallCanvas.height = Math.round(height * 0.7);
          const sCtx = smallCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            dataUrl = smallCanvas.toDataURL('image/jpeg', 0.6);
          }
        }

        resolve(dataUrl);
      };

      img.onerror = () => resolve(srcUrl);
      img.src = srcUrl;
    };

    if (typeof file === 'string') {
      if (file.startsWith('data:image')) {
        processImage(file);
      } else {
        resolve(file);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          processImage(result);
        } else {
          reject(new Error("Failed to read image file"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}
