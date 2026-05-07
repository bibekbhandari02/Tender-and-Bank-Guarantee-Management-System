const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// All files held in memory and streamed to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
  },
});

/**
 * Upload to Cloudinary:
 * - Images → resource_type: 'image'  (public, direct URL works)
 * - PDFs   → resource_type: 'raw'    (private, served via signed proxy)
 */
const uploadToCloudinary = (buffer, folder, mimetype) => {
  return new Promise((resolve, reject) => {
    const isPdf = mimetype === 'application/pdf';
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? 'raw' : 'image',
        ...(isPdf && {
          public_id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          format: 'pdf',
        }),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(buffer);
  });
};

/**
 * Generate a signed URL valid for 1 hour.
 * Used server-side to proxy PDFs to the client.
 */
const getSignedUrl = (publicId, resourceType = 'raw') => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    sign_url: true,
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { cloudinary, upload, uploadToCloudinary, getSignedUrl, deleteFromCloudinary };
