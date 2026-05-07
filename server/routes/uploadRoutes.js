const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
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

// ── Tender file routes ──
router.post('/tender/:id/bid-notice',    handleUpload(upload.array('files', 10)), uploadBidNotice);
router.post('/tender/:id/contract-docs', handleUpload(upload.array('files', 10)), uploadContractDocs);
router.delete('/tender/:id/bid-notice/:fileId',    deleteBidNoticeFile);
router.delete('/tender/:id/contract-docs/:fileId', deleteContractFile);

// ── Guarantee file routes ──
router.post('/guarantee/:id/files',           handleUpload(upload.array('files', 5)), uploadGuaranteeFilesCtrl);
router.delete('/guarantee/:id/files/:fileId', deleteGuaranteeFile);

module.exports = router;
