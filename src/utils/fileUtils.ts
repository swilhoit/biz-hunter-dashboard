/**
 * URL encodes a file path to handle special characters and spaces
 * @param filePath - The file path to encode
 * @returns The encoded file path
 */
export function encodeFilePath(filePath: string): string {
  if (!filePath) return '';
  
  // Split by '/' and encode each part separately to preserve path structure
  return filePath.split('/').map(part => encodeURIComponent(part)).join('/');
}

/**
 * Decodes a URL-encoded file path
 * @param encodedFilePath - The encoded file path to decode
 * @returns The decoded file path
 */
export function decodeFilePath(encodedFilePath: string): string {
  if (!encodedFilePath) return '';
  
  // Split by '/' and decode each part separately
  return encodedFilePath.split('/').map(part => decodeURIComponent(part)).join('/');
} 