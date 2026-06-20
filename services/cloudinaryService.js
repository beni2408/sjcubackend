import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Compress image with sharp before uploading — reduces payload by ~70-90%
async function compressImage(buffer) {
  try {
    const meta = await sharp(buffer).metadata();
    // Skip compression for already-small files (< 300KB)
    if (buffer.length < 300 * 1024) return buffer;
    return await sharp(buffer)
      .rotate() // auto-orient EXIF
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true })
      .toBuffer();
  } catch {
    return buffer; // fallback: send original if sharp fails
  }
}

export const uploadToCloudinary = async (fileBuffer, folder = 'sjcu') => {
  const compressed = await compressImage(fileBuffer);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(compressed);
  });
};

export const uploadVideoToCloudinary = async (fileBuffer, folder = 'sjcu') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        chunk_size: 6_000_000,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filenameWithExt = parts[parts.length - 1];
  const filename = filenameWithExt.split('.')[0];
  const folder = parts[parts.length - 2];
  return `${folder}/${filename}`;
};
