import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  // Accept if MIME starts with image/ OR extension matches — browsers vary in what they report
  const extOk = /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.originalname);
  const mimeOk = file.mimetype.startsWith('image/');
  console.log('[imageFilter]', file.originalname, file.mimetype, { extOk, mimeOk });
  if (extOk || mimeOk) return cb(null, true);
  cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP, HEIC)'));
};

const videoFilter = (req, file, cb) => {
  const allowed = /\.(mp4|mov|avi|webm|mkv|m4v|3gp|3g2|ts|flv|wmv)$/i;
  const ext = allowed.test(file.originalname);
  const mime = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';
  if (ext || mime) return cb(null, true);
  cb(new Error('Only video files are allowed (MP4, MOV, AVI, WebM, MKV, 3GP, etc.)'));
};

// Multiple images — up to 20 files, 10 MB each
export const uploadMultiple = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).array('images', 20);

// Single video — 500 MB limit
export const uploadSingleVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
}).single('video');

// Mixed images + videos — up to 20 files, 500 MB each (for gallery)
const imageOrVideoFilter = (req, file, cb) => {
  const imgExt = /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.originalname);
  const imgMime = file.mimetype.startsWith('image/');
  const vidExt = /\.(mp4|mov|avi|webm|mkv|m4v|3gp|3g2|ts|flv|wmv)$/i.test(file.originalname);
  const vidMime = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';
  if (imgExt || imgMime || vidExt || vidMime) return cb(null, true);
  cb(new Error('Only image or video files are allowed'));
};

export const uploadMixed = multer({
  storage,
  fileFilter: imageOrVideoFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
}).array('files', 20);

// Generic single image (used by other controllers)
export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
