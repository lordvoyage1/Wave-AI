/**
 * Wave AI — Image Generation — Image Metadata
 */
export class ImageMetadataReader {
  async read(file) {
    const basic = { name: file.name, size: file.size, type: file.type, lastModified: new Date(file.lastModified).toISOString() };
    const dimensions = await this._getDimensions(file);
    return { ...basic, ...dimensions, sizeFormatted: this._formatSize(file.size) };
  }

  _getDimensions(file) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { resolve({ width: img.width, height: img.height, aspectRatio: (img.width / img.height).toFixed(2) }); URL.revokeObjectURL(img.src); };
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });
  }

  _formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  async writeMetadata(imageBlob, metadata) {
    return { blob: imageBlob, metadata, note: "Full EXIF writing requires server-side processing" };
  }
}
export const imageMetadataReader = new ImageMetadataReader();
