const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_S3_BUCKET;
const CDN_URL = process.env.CDN_URL || `https://${BUCKET}.s3.amazonaws.com`;

// File type configurations
const ALLOWED_TYPES = {
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  any: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
};

const MAX_SIZES = {
  document: 10 * 1024 * 1024, // 10MB
  image: 5 * 1024 * 1024,     // 5MB
  avatar: 2 * 1024 * 1024     // 2MB
};

// Multer memory storage
const storage = multer.memoryStorage();

const fileFilter = (allowedMimeTypes) => (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} not allowed`, 400), false);
  }
};

const upload = {
  document: multer({ storage, fileFilter: fileFilter(ALLOWED_TYPES.document), limits: { fileSize: MAX_SIZES.document } }),
  image: multer({ storage, fileFilter: fileFilter(ALLOWED_TYPES.image), limits: { fileSize: MAX_SIZES.image } }),
  avatar: multer({ storage, fileFilter: fileFilter(ALLOWED_TYPES.image), limits: { fileSize: MAX_SIZES.avatar } }),
  any: multer({ storage, fileFilter: fileFilter(ALLOWED_TYPES.any), limits: { fileSize: MAX_SIZES.document } })
};

// Upload to S3
const uploadToS3 = async (file, folder, userId) => {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${userId}/${uuidv4()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentDisposition: 'inline',
    Metadata: { uploadedBy: userId, originalName: file.originalname }
  }));

  return {
    key,
    url: `${CDN_URL}/${key}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  };
};

// POST /api/v1/media/upload/document
exports.uploadDocument = [
  upload.any.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const { folder = 'documents' } = req.body;
      const result = await uploadToS3(req.file, folder, req.user.userId);
      logger.info(`Document uploaded: ${result.key} by user ${req.user.userId}`);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
];

// POST /api/v1/media/upload/image
exports.uploadImage = [
  upload.image.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const { folder = 'images' } = req.body;
      const result = await uploadToS3(req.file, folder, req.user.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
];

// POST /api/v1/media/upload/avatar
exports.uploadAvatar = [
  upload.avatar.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const result = await uploadToS3(req.file, 'avatars', req.user.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
];

// POST /api/v1/media/upload/multiple
exports.uploadMultiple = [
  upload.any.array('files', 5),
  async (req, res, next) => {
    try {
      if (!req.files?.length) throw new AppError('No files uploaded', 400);
      const { folder = 'documents' } = req.body;
      const results = await Promise.all(req.files.map(f => uploadToS3(f, folder, req.user.userId)));
      res.json({ success: true, data: results });
    } catch (error) { next(error); }
  }
];

// DELETE /api/v1/media/delete
exports.deleteFile = async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) throw new AppError('File key required', 400);

    // Security: ensure user owns the file (key contains userId)
    if (!key.includes(req.user.userId) && !['admin', 'superadmin'].includes(req.user.role)) {
      throw new AppError('Not authorized to delete this file', 403);
    }

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    res.json({ success: true, message: 'File deleted' });
  } catch (error) { next(error); }
};
