const path = require('path');
const Tender = require('../models/Tender');
const BankGuarantee = require('../models/BankGuarantee');
const {
  uploadImageToCloudinary,
  deleteFromCloudinary,
  deleteLocalFile,
} = require('../config/cloudinary');

const isPdf = (mimetype) => mimetype === 'application/pdf';

/**
 * Process uploaded files:
 * - Images → upload to Cloudinary, get secure_url
 * - PDFs   → already saved to disk by multer, build local URL
 */
const processUploads = async (files, cloudinaryFolder) => {
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';

  return Promise.all(
    files.map(async (file) => {
      if (isPdf(file.mimetype)) {
        // PDF: served directly from /uploads/<filename>
        return {
          url: `${baseUrl}/uploads/${file.filename}`,
          public_id: file.filename,   // just the filename for local files
          resource_type: 'local',
          file_name: file.originalname,
          file_type: file.mimetype,
        };
      } else {
        // Image: upload buffer to Cloudinary
        const fs = require('fs');
        const buffer = fs.readFileSync(file.path);
        // Remove the temp disk file after reading
        fs.unlinkSync(file.path);
        const result = await uploadImageToCloudinary(buffer, cloudinaryFolder);
        return {
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: 'image',
          file_name: file.originalname,
          file_type: file.mimetype,
        };
      }
    })
  );
};

const deleteFile = (file) => {
  if (file.resource_type === 'local') {
    deleteLocalFile(file.public_id);
  } else {
    deleteFromCloudinary(file.public_id);
  }
};

// ─── TENDER UPLOADS ──────────────────────────────────────────────

exports.uploadBidNotice = async (req, res) => {
  try {
    if (!req.files?.length)
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    const newFiles = await processUploads(req.files, 'tender-management/tenders');
    tender.bidNoticeFiles.push(...newFiles);
    await tender.save();
    res.json({ success: true, data: tender.bidNoticeFiles, message: 'Files uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadContractDocs = async (req, res) => {
  try {
    if (!req.files?.length)
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    const newFiles = await processUploads(req.files, 'tender-management/tenders');
    tender.contractFiles.push(...newFiles);
    await tender.save();
    res.json({ success: true, data: tender.contractFiles, message: 'Files uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBidNoticeFile = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    const file = tender.bidNoticeFiles.id(req.params.fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    deleteFile(file);
    tender.bidNoticeFiles.pull(req.params.fileId);
    await tender.save();
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteContractFile = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    const file = tender.contractFiles.id(req.params.fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    deleteFile(file);
    tender.contractFiles.pull(req.params.fileId);
    await tender.save();
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GUARANTEE UPLOADS ───────────────────────────────────────────

exports.uploadGuaranteeFiles = async (req, res) => {
  try {
    if (!req.files?.length)
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    const guarantee = await BankGuarantee.findById(req.params.id);
    if (!guarantee) return res.status(404).json({ success: false, message: 'Guarantee not found' });
    const newFiles = await processUploads(req.files, 'tender-management/guarantees');
    guarantee.guaranteeFiles.push(...newFiles);
    await guarantee.save();
    res.json({ success: true, data: guarantee.guaranteeFiles, message: 'Files uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteGuaranteeFile = async (req, res) => {
  try {
    const guarantee = await BankGuarantee.findById(req.params.id);
    if (!guarantee) return res.status(404).json({ success: false, message: 'Guarantee not found' });
    const file = guarantee.guaranteeFiles.id(req.params.fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    deleteFile(file);
    guarantee.guaranteeFiles.pull(req.params.fileId);
    await guarantee.save();
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── BULK DELETE ─────────────────────────────────────────────────

exports.deleteAllTenderFiles = async (tender) => {
  const all = [...(tender.bidNoticeFiles || []), ...(tender.contractFiles || [])];
  all.forEach(deleteFile);
};

exports.deleteAllGuaranteeFiles = async (guarantee) => {
  (guarantee.guaranteeFiles || []).forEach(deleteFile);
};
