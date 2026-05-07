const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// All files go through memory — streamed directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
  },
});

/**
 * Upload any file to Cloudinary via upload_stream.
 * Both images AND PDFs use resource_type: 'image' so URLs are always public.
 * Cloudinary natively supports PDF as an image resource type.
 *
 * Returns the full Cloudinary result object.
 */
const uploadToCloudinary = (buffer, folder, mimetype) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
      // For PDFs, set format explicitly so the URL ends in .pdf
      ...(mimetype === 'application/pdf' && { format: 'pdf' }),
    };

    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }).end(buffer);
  });
};

/**
 * Delete a file from Cloudinary.
 * All files (images and PDFs) use resource_type: 'image'.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
};
