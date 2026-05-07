const BankGuarantee = require('../models/BankGuarantee');

// @desc  Get all guarantees for verification dashboard
// @route GET /api/verification/guarantees
exports.getVerificationGuarantees = async (req, res) => {
  try {
    const {
      type, bankName, status, employer,
      expiryFrom, expiryTo, search,
      sortBy = 'expiryDate', sortOrder = 'asc',
      page = 1, limit = 10,
    } = req.query;

    // Base query — always scoped to authenticated user
    const query = { userId: req.user._id };

    // Guarantee type filter
    if (type) {
      const types = type.split(',').map((t) => t.trim()).filter(Boolean);
      if (types.length) query.guaranteeType = { $in: types };
    }

    // Bank name filter
    if (bankName) {
      const banks = bankName.split(',').map((b) => b.trim()).filter(Boolean);
      if (banks.length) query.bankName = { $in: banks };
    }

    // Status filter
    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length) query.status = { $in: statuses };
    }

    // Expiry date range
    if (expiryFrom || expiryTo) {
      query.expiryDate = {};
      if (expiryFrom) query.expiryDate.$gte = new Date(expiryFrom);
      if (expiryTo) query.expiryDate.$lte = new Date(expiryTo);
    }

    // Guarantee number search (DB level)
    if (search) {
      query.guaranteeNumber = { $regex: search, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = [10, 25, 50].includes(parseInt(limit)) ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;
    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Fetch with tender population
    let guarantees = await BankGuarantee.find(query)
      .populate('tenderId', 'contractNumber contractTitle contractAmount employerOfficeName employeeName contractStartDate contractEndDate')
      .sort(sortObj)
      .lean();

    // Post-query filters that require populated tender fields
    if (search) {
      const searchLower = search.toLowerCase();
      guarantees = guarantees.filter((g) => {
        const inGuaranteeNum = g.guaranteeNumber?.toLowerCase().includes(searchLower);
        const inContractNum = g.tenderId?.contractNumber?.toLowerCase().includes(searchLower);
        const inEmployer = g.tenderId?.employerOfficeName?.toLowerCase().includes(searchLower);
        return inGuaranteeNum || inContractNum || inEmployer;
      });
    }

    if (employer) {
      const employers = employer.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
      if (employers.length) {
        guarantees = guarantees.filter((g) =>
          employers.some((e) => g.tenderId?.employerOfficeName?.toLowerCase().includes(e))
        );
      }
    }

    const total = guarantees.length;
    const paginated = guarantees.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (error) {
    console.error('[verificationController]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
