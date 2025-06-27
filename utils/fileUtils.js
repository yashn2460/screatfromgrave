const path = require('path');

/**
 * Normalize file path for web URLs
 * Converts Windows backslashes to forward slashes
 * @param {string} filePath - The file path to normalize
 * @returns {string} - Normalized path with forward slashes
 */
const normalizeFilePath = (filePath) => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, '/');
};

/**
 * Get the full URL for a file
 * @param {string} filePath - The relative file path
 * @param {string} baseUrl - The base URL of the server (optional)
 * @returns {string} - Full URL to the file
 */
const getFileUrl = (filePath, baseUrl = '') => {
  if (!filePath) return null;
  const normalizedPath = normalizeFilePath(filePath);
  return `${baseUrl}/${normalizedPath}`;
};

/**
 * Extract filename from path
 * @param {string} filePath - The file path
 * @returns {string} - Just the filename
 */
const getFilename = (filePath) => {
  if (!filePath) return null;
  return path.basename(filePath);
};

/**
 * Get file extension
 * @param {string} filePath - The file path
 * @returns {string} - File extension (without dot)
 */
const getFileExtension = (filePath) => {
  if (!filePath) return null;
  return path.extname(filePath).toLowerCase().substring(1);
};

/**
 * Check if file is an image
 * @param {string} filePath - The file path
 * @returns {boolean} - True if file is an image
 */
const isImageFile = (filePath) => {
  const ext = getFileExtension(filePath);
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
};

/**
 * Check if file is a PDF
 * @param {string} filePath - The file path
 * @returns {boolean} - True if file is a PDF
 */
const isPdfFile = (filePath) => {
  const ext = getFileExtension(filePath);
  return ext === 'pdf';
};

/**
 * Generate a unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${prefix}${name}-${timestamp}-${random}${ext}`;
};

module.exports = {
  normalizeFilePath,
  getFileUrl,
  getFilename,
  getFileExtension,
  isImageFile,
  isPdfFile,
  generateUniqueFilename
}; 