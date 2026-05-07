const Tender = require('../models/Tender');
const BankGuarantee = require('../models/BankGuarantee');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    // Last 6 months range
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalTenders,
      activeTenders,
      completedTenders,
      expiredTenders,
      cancelledTenders,
      totalGuarantees,
      activeGuarantees,
      expiringGuarantees,
      expiredGuarantees,
      releasedGuarantees,
      contractAmountAgg,
      guaranteeAmountAgg,
      tendersByType,
      guaranteesByType,
      monthlyTrend,
      contractAmountByType,
      recentTenders,
      topGuarantees,
    ] = await Promise.all([
      Tender.countDocuments(),
      Tender.countDocuments({ status: 'Active' }),
      Tender.countDocuments({ status: 'Completed' }),
      Tender.countDocuments({ status: 'Expired' }),
      Tender.countDocuments({ status: 'Cancelled' }),
      BankGuarantee.countDocuments(),
      BankGuarantee.countDocuments({ status: 'Active' }),
      BankGuarantee.countDocuments({
        status: 'Active',
        expiryDate: { $gte: now, $lte: thirtyDaysLater },
      }),
      BankGuarantee.countDocuments({ status: 'Expired' }),
      BankGuarantee.countDocuments({ status: 'Released' }),

      // Total contract value
      Tender.aggregate([
        { $group: { _id: null, total: { $sum: '$contractAmount' } } },
      ]),

      // Active guarantee value
      BankGuarantee.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$guaranteeAmount' } } },
      ]),

      // Tenders by contract type (count)
      Tender.aggregate([
        { $group: { _id: '$contractType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Guarantees by type
      BankGuarantee.aggregate([
        { $group: { _id: '$guaranteeType', count: { $sum: 1 }, totalAmount: { $sum: '$guaranteeAmount' } } },
        { $sort: { count: -1 } },
      ]),

      // Monthly tender creation trend (last 6 months)
      Tender.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$contractAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Contract amount by type
      Tender.aggregate([
        { $group: { _id: '$contractType', totalAmount: { $sum: '$contractAmount' }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } },
      ]),

      // Recent tenders
      Tender.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('contractNumber contractTitle employeeName contractAmount status createdAt contractType'),

      // Top guarantees by amount
      BankGuarantee.find({ status: 'Active' })
        .sort({ guaranteeAmount: -1 })
        .limit(5)
        .populate('tenderId', 'contractNumber contractTitle')
        .select('bankName guaranteeType guaranteeAmount expiryDate status tenderId'),
    ]);

    // Build full 6-month trend (fill missing months with 0)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};
    monthlyTrend.forEach(({ _id, count, totalAmount }) => {
      trendMap[`${_id.year}-${_id.month}`] = { count, totalAmount };
    });

    const fullTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      fullTrend.push({
        month: monthNames[d.getMonth()],
        count: trendMap[key]?.count || 0,
        totalAmount: trendMap[key]?.totalAmount || 0,
      });
    }

    res.json({
      success: true,
      data: {
        tenders: {
          total: totalTenders,
          active: activeTenders,
          completed: completedTenders,
          expired: expiredTenders,
          cancelled: cancelledTenders,
          totalAmount: contractAmountAgg[0]?.total || 0,
        },
        guarantees: {
          total: totalGuarantees,
          active: activeGuarantees,
          expiring: expiringGuarantees,
          expired: expiredGuarantees,
          released: releasedGuarantees,
          totalAmount: guaranteeAmountAgg[0]?.total || 0,
        },
        tendersByType,
        guaranteesByType,
        contractAmountByType,
        monthlyTrend: fullTrend,
        recentTenders,
        topGuarantees,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
