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

/**
 * Deletes a single uploaded file from disk.
 * Accepts either the relative fileUrl (e.g. "/uploads/resume/123.pdf")
 * or an absolute path. Resolves safely against the uploads root so
 * it can't escape outside it.
 */
const deleteFile = (fileUrl) => {
  try {
    if (!fileUrl) return { fileUrl, deleted: false, reason: 'no fileUrl provided' };

    const uploadsRoot = path.join(process.cwd(), 'uploads');

    // normalize: strip leading "/uploads/" or "uploads/" if present
    const relative = fileUrl.replace(/^\/?uploads\//, '');
    const fullPath = path.join(uploadsRoot, relative);

    // guard against path traversal
    if (!fullPath.startsWith(uploadsRoot)) {
      return { fileUrl, deleted: false, reason: 'invalid path' };
    }

    if (!fs.existsSync(fullPath)) {
      return { fileUrl, deleted: false, reason: 'file not found' };
    }

    fs.unlinkSync(fullPath);
    return { fileUrl, deleted: true };
  } catch (err) {
    return { fileUrl, deleted: false, reason: err.message };
  }
};

/**
 * Deletes multiple files. Accepts an array of fileUrls (strings)
 * or an array of info objects ({ fileUrl }) like the ones
 * processUpload produces.
 */
const deleteFiles = (fileUrls = []) => {
  const list = Array.isArray(fileUrls) ? fileUrls : [fileUrls];

  const results = list.map((item) => {
    const url = typeof item === 'string' ? item : item?.fileUrl;
    return deleteFile(url);
  });

  return {
    total: results.length,
    deletedCount: results.filter((r) => r.deleted).length,
    results,
  };
};

/**
 * Optional Express middlewares if you want direct routes:
 * DELETE /files  body: { fileUrl }
 * DELETE /files/bulk  body: { fileUrls: [...] }
 */
const deleteFileHandler = (req, res) => {
  const { fileUrl } = req.body;
  const result = deleteFile(fileUrl);
  if (!result.deleted) return res.status(400).json(result);
  return res.status(200).json(result);
};

const deleteFilesHandler = (req, res) => {
  const { fileUrls } = req.body;
  if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
    return res.status(400).json({ message: 'fileUrls must be a non-empty array' });
  }
  const result = deleteFiles(fileUrls);
  return res.status(200).json(result);
};
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


module.exports = {
  upload,
  uploadDoc,
  processUpload,
  deleteFile,
  deleteFiles,
  deleteFileHandler,
  deleteFilesHandler,
};