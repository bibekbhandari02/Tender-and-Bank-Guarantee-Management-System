const BankGuarantee = require('../models/BankGuarantee');
const Tender = require('../models/Tender');
const { deleteAllGuaranteeFiles } = require('./uploadController');

exports.getGuaranteesByTender = async (req, res) => {
  try {
    // Verify tender belongs to user
    const tender = await Tender.findOne({ _id: req.params.tenderId, userId: req.user._id });
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

    const guarantees = await BankGuarantee.find({ tenderId: req.params.tenderId }).sort({ createdAt: -1 });
    res.json({ success: true, data: guarantees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGuarantee = async (req, res) => {
  try {
    const guarantee = await BankGuarantee.findOne({ _id: req.params.id, userId: req.user._id }).populate('tenderId');
    if (!guarantee) return res.status(404).json({ success: false, message: 'Bank guarantee not found' });
    res.json({ success: true, data: guarantee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGuarantee = async (req, res) => {
  try {
    const tender = await Tender.findOne({ _id: req.body.tenderId, userId: req.user._id });
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

    if (new Date(req.body.expiryDate) <= new Date(req.body.issuedDate)) {
      return res.status(400).json({ success: false, message: 'Expiry date must be after issued date' });
    }

    const guarantee = await BankGuarantee.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: guarantee, message: 'Bank guarantee created successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGuarantee = async (req, res) => {
  try {
    if (req.body.expiryDate && req.body.issuedDate) {
      if (new Date(req.body.expiryDate) <= new Date(req.body.issuedDate)) {
        return res.status(400).json({ success: false, message: 'Expiry date must be after issued date' });
      }
    }

    const guarantee = await BankGuarantee.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!guarantee) return res.status(404).json({ success: false, message: 'Bank guarantee not found' });
    res.json({ success: true, data: guarantee, message: 'Bank guarantee updated successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGuarantee = async (req, res) => {
  try {
    const guarantee = await BankGuarantee.findOne({ _id: req.params.id, userId: req.user._id });
    if (!guarantee) return res.status(404).json({ success: false, message: 'Bank guarantee not found' });
    await deleteAllGuaranteeFiles(guarantee);
    await BankGuarantee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bank guarantee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpiringGuarantees = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const guarantees = await BankGuarantee.find({
      userId: req.user._id,
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
