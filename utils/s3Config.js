const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET || "secret-from-grave",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `videos/${uniqueSuffix}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept only video files
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Function to get video duration and size
const getVideoMetadata = async (file) => {
  // This is a placeholder. In a real application, you would use a library like ffmpeg
  // to get the actual video duration. For now, we'll return a default value.
  return {
    duration: 0, // This should be replaced with actual video duration
    size: file.size
  };
};

module.exports = {
  upload,
  s3Client,
  getVideoMetadata
}; 