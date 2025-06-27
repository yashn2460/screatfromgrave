# File Path Normalization

This document explains the file path normalization issue and the solution implemented to ensure consistent file URLs across different operating systems.

## Problem

On Windows systems, file paths are stored with backslashes (`\`), but web URLs require forward slashes (`/`). This causes issues when displaying file URLs in the API responses.

### Example of the Problem

**Windows File Path:**
```
uploads\death-certificates\deathCertificate-1750940562258-151695822.pdf
```

**Expected Web URL:**
```
uploads/death-certificates/deathCertificate-1750940562258-151695822.pdf
```

## Solution

### 1. File Utility Functions (`utils/fileUtils.js`)

Created a comprehensive utility module to handle file path operations:

```javascript
const { normalizeFilePath, getFileUrl, getFilename, getFileExtension } = require('./utils/fileUtils');

// Normalize Windows paths to web URLs
const webUrl = normalizeFilePath('uploads\\file.pdf');
// Result: 'uploads/file.pdf'

// Generate full URL for file access
const fullUrl = getFileUrl('uploads/file.pdf', 'http://localhost:3000');
// Result: 'http://localhost:3000/uploads/file.pdf'
```

### 2. Updated Death Verification Controller

Modified the death verification process to normalize file paths:

```javascript
// Handle file upload for death certificate
let deathCertificateUrl = null;
if (req.file) {
  // Normalize file path to use forward slashes for web URLs
  const filePath = req.file.path || req.file.filename;
  deathCertificateUrl = normalizeFilePath(filePath);
}
```

### 3. Enhanced Admin API Response

Updated the admin death verification listing to include full URLs:

```javascript
// Process death verifications to add full URLs
const processedVerifications = deathVerifications.map(verification => {
  const verificationObj = verification.toObject();
  
  // Add full URL for death certificate if it exists
  if (verificationObj.death_certificate_url) {
    verificationObj.death_certificate_url_full = getFileUrl(
      verificationObj.death_certificate_url, 
      process.env.BASE_URL || 'http://localhost:3000'
    );
  }
  
  return verificationObj;
});
```

## API Response Format

### Before (Problematic)
```json
{
  "death_certificate_url": "uploads\\death-certificates\\file.pdf"
}
```

### After (Fixed)
```json
{
  "death_certificate_url": "uploads/death-certificates/file.pdf",
  "death_certificate_url_full": "http://localhost:3000/uploads/death-certificates/file.pdf"
}
```

## Available Utility Functions

### `normalizeFilePath(filePath)`
- Converts Windows backslashes to forward slashes
- Returns `null` for null/undefined input
- Handles empty strings

### `getFileUrl(filePath, baseUrl)`
- Generates full URL for file access
- Normalizes path automatically
- Optional base URL parameter

### `getFilename(filePath)`
- Extracts just the filename from a path
- Works with both Windows and Unix paths

### `getFileExtension(filePath)`
- Returns file extension (without dot)
- Case-insensitive

### `isImageFile(filePath)`
- Checks if file is an image
- Supports: jpg, jpeg, png, gif, bmp, webp

### `isPdfFile(filePath)`
- Checks if file is a PDF

### `generateUniqueFilename(originalName, prefix)`
- Creates unique filenames with timestamps
- Useful for file uploads

## Testing

Run the file path normalization test:

```bash
node test-file-path-normalization.js
```

This will test various scenarios including:
- Windows paths with backslashes
- Unix paths with forward slashes
- Null and empty inputs
- Subfolder paths

## Configuration

### Environment Variables

Set the base URL for file access:

```env
BASE_URL=http://localhost:3000
```

### Static File Serving

The server is configured to serve static files:

```javascript
// Serve static files for uploaded death certificates
app.use('/uploads', express.static('uploads'));
```

This allows direct access to files via URLs like:
`http://localhost:3000/uploads/death-certificates/file.pdf`

## Benefits

1. **Cross-Platform Compatibility**: Works consistently on Windows, macOS, and Linux
2. **Web-Ready URLs**: All file paths are properly formatted for web use
3. **Full URL Access**: Provides complete URLs for direct file access
4. **Backward Compatibility**: Existing file paths are automatically normalized
5. **Centralized Logic**: All file path operations use the same utility functions

## Migration Notes

- Existing file paths in the database will be automatically normalized when accessed
- New file uploads will use normalized paths from the start
- No database migration required
- Backward compatible with existing file paths 