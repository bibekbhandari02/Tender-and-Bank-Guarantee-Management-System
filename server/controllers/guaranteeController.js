const BankGuarantee = require('../models/BankGuarantee');
const Tender = require('../models/Tender');
const { deleteAllGuaranteeFiles } = require('./uploadController');

// @desc    Get all guarantees for a tender
// @route   GET /api/guarantees/tender/:tenderId
exports.getGuaranteesByTender = async (req, res) => {
  try {
    const guarantees = await BankGuarantee.find({ tenderId: req.params.tenderId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: guarantees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single guarantee
// @route   GET /api/guarantees/:id
exports.getGuarantee = async (req, res) => {
  try {
    const guarantee = await BankGuarantee.findById(req.params.id).populate('tenderId');
    if (!guarantee) {
      return res.status(404).json({ success: false, message: 'Bank guarantee not found' });
    }
    res.json({ success: true, data: guarantee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create bank guarantee
// @route   POST /api/guarantees
exports.createGuarantee = async (req, res) => {
  try {
    // Verify tender exists
    const tender = await Tender.findById(req.body.tenderId);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    // Validate dates
    if (new Date(req.body.expiryDate) <= new Date(req.body.issuedDate)) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after issued date',
      });
    }

    const guarantee = await BankGuarantee.create(req.body);
    res.status(201).json({
      success: true,
      data: guarantee,
      message: 'Bank guarantee created successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update bank guarantee
// @route   PUT /api/guarantees/:id
exports.updateGuarantee = async (req, res) => {
  try {
    // Validate dates if provided
    if (req.body.expiryDate && req.body.issuedDate) {
      if (new Date(req.body.expiryDate) <= new Date(req.body.issuedDate)) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date must be after issued date',
        });
      }
    }

    const guarantee = await BankGuarantee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!guarantee) {
      return res.status(404).json({ success: false, message: 'Bank guarantee not found' });
    }

    res.json({ success: true, data: guarantee, message: 'Bank guarantee updated successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete bank guarantee
// @route   DELETE /api/guarantees/:id
exports.deleteGuarantee = async (req, res) => {
  try {
    const guarantee = await BankGuarantee.findById(req.params.id);
    if (!guarantee) {
      return res.status(404).json({ success: false, message: 'Bank guarantee not found' });
    }
    await deleteAllGuaranteeFiles(guarantee);
    await BankGuarantee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bank guarantee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expiring guarantees (within 30 days)
// @route   GET /api/guarantees/expiring
exports.getExpiringGuarantees = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const guarantees = await BankGuarantee.find({
      status: 'Active',
      expiryDate: { $gte: new Date(), $lte: futureDate },
    })
      .populate('tenderId', 'contractNumber contractTitle employeeName')
      .sort({ expiryDate: 1 });

    res.json({ success: true, data: guarantees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
