const express = require('express');
const https = require('https');
const router = express.Router();
const { upload, getSignedUrl } = require('../config/cloudinary');
const {
  uploadBidNotice,
  uploadContractDocs,
  deleteBidNoticeFile,
  deleteContractFile,
  uploadGuaranteeFiles: uploadGuaranteeFilesCtrl,
  deleteGuaranteeFile,
} = require('../controllers/uploadController');

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

// ── PDF Proxy ────────────────────────────────────────────────────
// Generates a signed Cloudinary URL server-side and streams the file
// back to the client — bypasses Cloudinary's auth on raw resources.
// GET /api/upload/pdf-proxy?publicId=<id>
router.get('/pdf-proxy', (req, res) => {
  const { publicId } = req.query;
  if (!publicId) return res.status(400).json({ message: 'Missing publicId' });

  try {
    const signedUrl = getSignedUrl(publicId, 'raw');

    https.get(signedUrl, (upstream) => {
      if (upstream.statusCode !== 200) {
        upstream.resume();
        return res.status(upstream.statusCode).json({ message: `Cloudinary returned ${upstream.statusCode}` });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      if (upstream.headers['content-length'])
        res.setHeader('Content-Length', upstream.headers['content-length']);
      upstream.pipe(res);
    }).on('error', (err) => res.status(500).json({ message: err.message }));
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
