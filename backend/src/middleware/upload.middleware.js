const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
};

const storage = multer.memoryStorage();

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (allowed) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error(`File type ${file.mimetype} not allowed`), false);
};

// Image-only uploader (avatars, doc photos, onboarding images, etc.)
const upload = multer({
  storage,
  fileFilter: fileFilter(IMAGE_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Mixed uploader (resume can be pdf/doc as well as image)
const uploadDoc = multer({
  storage,
  fileFilter: fileFilter([...IMAGE_TYPES, ...DOC_TYPES]),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Processes req.file (single) and req.files (fields/array). Images are
 * compressed with sharp; pdf/doc are written through as-is. Populates
 * req.uploadedFiles keyed by field name (compatible with the old controllers).
 */
const processUpload = (folder = 'temp') => async (req, _res, next) => {
  try {
    const basePath = path.join(process.cwd(), 'uploads', folder);
    ensureFolder(basePath);
    req.uploadedFiles = {};

    const persist = async (file) => {
      const isImage = IMAGE_TYPES.includes(file.mimetype);
      const ext = isImage ? 'jpg' : (path.extname(file.originalname) || '.bin').slice(1);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      const outputPath = path.join(basePath, fileName);

      if (isImage) {
        await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);
      } else {
        fs.writeFileSync(outputPath, file.buffer);
      }
      return { fileUrl: `/uploads/${folder}/${fileName}`, fileType: file.mimetype, fileName: file.originalname };
    };

    if (req.file) {
      const info = await persist(req.file);
      req.file.path = info.fileUrl;
      req.uploadedFiles[req.file.fieldname] = info.fileUrl; // string (legacy single)
      req.uploadedFiles[`${req.file.fieldname}_info`] = info; // full info
    }

    if (req.files) {
      const isArray = Array.isArray(req.files);
      if (isArray) {
        for (const file of req.files) {
          const info = await persist(file);
          file.path = info.fileUrl;
          (req.uploadedFiles[file.fieldname] ||= []).push(info);
        }
      } else {
        for (const fieldName of Object.keys(req.files)) {
          req.uploadedFiles[fieldName] = [];
          for (const file of req.files[fieldName]) {
            const info = await persist(file);
            file.path = info.fileUrl;
            req.uploadedFiles[fieldName].push(info);
          }
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, uploadDoc, processUpload };
