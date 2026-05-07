const Tender = require('../models/Tender');
const BankGuarantee = require('../models/BankGuarantee');
const { deleteAllTenderFiles, deleteAllGuaranteeFiles } = require('./uploadController');

// @desc    Get all tenders for the logged-in user
exports.getTenders = async (req, res) => {
  try {
    const {
      search, status, contractType,
      startDate, endDate, minAmount, maxAmount,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { employeeName: { $regex: search, $options: 'i' } },
        { contractTitle: { $regex: search, $options: 'i' } },
        { employerOfficeName: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (contractType) query.contractType = contractType;
    if (startDate || endDate) {
      query.contractDate = {};
      if (startDate) query.contractDate.$gte = new Date(startDate);
      if (endDate) query.contractDate.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.contractAmount = {};
      if (minAmount) query.contractAmount.$gte = Number(minAmount);
      if (maxAmount) query.contractAmount.$lte = Number(maxAmount);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tenders, total] = await Promise.all([
      Tender.find(query).sort(sortObj).skip(skip).limit(Number(limit)).populate('bankGuarantees'),
      Tender.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tenders,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single tender (must belong to user)
exports.getTender = async (req, res) => {
  try {
    const tender = await Tender.findOne({ _id: req.params.id, userId: req.user._id }).populate('bankGuarantees');
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    res.json({ success: true, data: tender });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create tender
exports.createTender = async (req, res) => {
  try {
    const existing = await Tender.findOne({ contractNumber: req.body.contractNumber, userId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Contract number already exists' });

    const tender = await Tender.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: tender, message: 'Tender created successfully' });
  } catch (error) {
    console.error('[createTender error]', error.message, error.code);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Contract number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tender
exports.updateTender = async (req, res) => {
  try {
    if (req.body.contractNumber) {
      const existing = await Tender.findOne({
        contractNumber: req.body.contractNumber,
        userId: req.user._id,
        _id: { $ne: req.params.id },
      });
      if (existing) return res.status(400).json({ success: false, message: 'Contract number already exists' });
    }

    const tender = await Tender.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('bankGuarantees');

    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    res.json({ success: true, data: tender, message: 'Tender updated successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete tender (cascade)
exports.deleteTender = async (req, res) => {
  try {
    const tender = await Tender.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

    const guarantees = await BankGuarantee.find({ tenderId: req.params.id });
    await Promise.all(guarantees.map((g) => deleteAllGuaranteeFiles(g)));
    await deleteAllTenderFiles(tender);
    await BankGuarantee.deleteMany({ tenderId: req.params.id });
    await Tender.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Tender deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
