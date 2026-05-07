const Tender = require('../models/Tender');
const BankGuarantee = require('../models/BankGuarantee');

exports.getDashboardStats = async (req, res) => {
  try {
    const uid = req.user._id;
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalTenders, activeTenders, completedTenders, expiredTenders, cancelledTenders,
      totalGuarantees, activeGuarantees, expiringGuarantees, expiredGuarantees, releasedGuarantees,
      contractAmountAgg, guaranteeAmountAgg,
      tendersByType, guaranteesByType, monthlyTrend, contractAmountByType,
      recentTenders, topGuarantees,
    ] = await Promise.all([
      Tender.countDocuments({ userId: uid }),
      Tender.countDocuments({ userId: uid, status: 'Active' }),
      Tender.countDocuments({ userId: uid, status: 'Completed' }),
      Tender.countDocuments({ userId: uid, status: 'Expired' }),
      Tender.countDocuments({ userId: uid, status: 'Cancelled' }),
      BankGuarantee.countDocuments({ userId: uid }),
      BankGuarantee.countDocuments({ userId: uid, status: 'Active' }),
      BankGuarantee.countDocuments({ userId: uid, status: 'Active', expiryDate: { $gte: now, $lte: thirtyDaysLater } }),
      BankGuarantee.countDocuments({ userId: uid, status: 'Expired' }),
      BankGuarantee.countDocuments({ userId: uid, status: 'Released' }),
      Tender.aggregate([{ $match: { userId: uid } }, { $group: { _id: null, total: { $sum: '$contractAmount' } } }]),
      BankGuarantee.aggregate([{ $match: { userId: uid, status: 'Active' } }, { $group: { _id: null, total: { $sum: '$guaranteeAmount' } } }]),
      Tender.aggregate([{ $match: { userId: uid } }, { $group: { _id: '$contractType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      BankGuarantee.aggregate([{ $match: { userId: uid } }, { $group: { _id: '$guaranteeType', count: { $sum: 1 }, totalAmount: { $sum: '$guaranteeAmount' } } }, { $sort: { count: -1 } }]),
      Tender.aggregate([
        { $match: { userId: uid, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, totalAmount: { $sum: '$contractAmount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Tender.aggregate([{ $match: { userId: uid } }, { $group: { _id: '$contractType', totalAmount: { $sum: '$contractAmount' }, count: { $sum: 1 } } }, { $sort: { totalAmount: -1 } }]),
      Tender.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).select('contractNumber contractTitle employeeName contractAmount status createdAt contractType'),
      BankGuarantee.find({ userId: uid, status: 'Active' }).sort({ guaranteeAmount: -1 }).limit(5).populate('tenderId', 'contractNumber contractTitle').select('bankName guaranteeType guaranteeAmount expiryDate status tenderId'),
    ]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const trendMap = {};
    monthlyTrend.forEach(({ _id, count, totalAmount }) => {
      trendMap[`${_id.year}-${_id.month}`] = { count, totalAmount };
    });
    const fullTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      fullTrend.push({ month: monthNames[d.getMonth()], count: trendMap[key]?.count || 0, totalAmount: trendMap[key]?.totalAmount || 0 });
    }

    res.json({
      success: true,
      data: {
        tenders: { total: totalTenders, active: activeTenders, completed: completedTenders, expired: expiredTenders, cancelled: cancelledTenders, totalAmount: contractAmountAgg[0]?.total || 0 },
        guarantees: { total: totalGuarantees, active: activeGuarantees, expiring: expiringGuarantees, expired: expiredGuarantees, released: releasedGuarantees, totalAmount: guaranteeAmountAgg[0]?.total || 0 },
        tendersByType, guaranteesByType, contractAmountByType, monthlyTrend: fullTrend, recentTenders, topGuarantees,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
