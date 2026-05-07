const Tender = require('../models/Tender');
const BankGuarantee = require('../models/BankGuarantee');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const isPdf = (mimetype) => mimetype === 'application/pdf';

/**
 * Upload all files in req.files to Cloudinary.
 * Returns array of file metadata objects ready to push into MongoDB.
 */
const processUploads = async (files, folder) => {
  return Promise.all(
    files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, folder, file.mimetype);
      return {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type, // 'image' or 'raw'
        file_name: file.originalname,
        file_type: file.mimetype,
      };
    })
  );
};

const deleteFile = (file) => {
  const resourceType = file.resource_type || (file.file_type === 'application/pdf' ? 'raw' : 'image');
  deleteFromCloudinary(file.public_id, resourceType);
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
