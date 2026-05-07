const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const {
  uploadBidNotice,
  uploadContractDocs,
  deleteBidNoticeFile,
  deleteContractFile,
  uploadGuaranteeFiles: uploadGuaranteeFilesCtrl,
  deleteGuaranteeFile,
} = require('../controllers/uploadController');

// Multer error handler
const handleUpload = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ success: false, message: 'File too large. Max 10MB.' });
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ── Signed URL for viewing raw (PDF) files ──────────────────────
// GET /api/upload/signed-url?publicId=<id>&resourceType=raw
// Returns a short-lived signed URL the client can use in an iframe
router.get('/signed-url', (req, res) => {
  const { publicId, resourceType = 'raw' } = req.query;
  if (!publicId) return res.status(400).json({ message: 'Missing publicId' });

  try {
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      sign_url: true,
      type: 'upload',
    });
    res.json({ url: signedUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Tender file routes ──
router.post('/tender/:id/bid-notice',    handleUpload(upload.array('files', 10)), uploadBidNotice);
router.post('/tender/:id/contract-docs', handleUpload(upload.array('files', 10)), uploadContractDocs);
router.delete('/tender/:id/bid-notice/:fileId',    deleteBidNoticeFile);
router.delete('/tender/:id/contract-docs/:fileId', deleteContractFile);

// ── Guarantee file routes ──
router.post('/guarantee/:id/files',           handleUpload(upload.array('files', 5)), uploadGuaranteeFilesCtrl);
router.delete('/guarantee/:id/files/:fileId', deleteGuaranteeFile);

module.exports = router;
