import { differenceInCalendarDays, parseISO } from 'date-fns';

const toDate = (d) => (typeof d === 'string' ? parseISO(d) : d);

export const computeRemainingDays = (expiryDate) => {
  if (!expiryDate) return null;
  return differenceInCalendarDays(toDate(expiryDate), new Date());
};

export const computeVerificationStatus = (guarantee) => {
  const { status, expiryDate } = guarantee;
  if (status === 'Released' || status === 'Claimed') return 'Released';
  if (status === 'Expired') return 'Expired';
  const days = computeRemainingDays(expiryDate);
  if (days === null) return 'Active';
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring Soon';
  return 'Active';
};

export const computeExpectedAmount = (guaranteeType, contractAmount) => {
  if (!contractAmount) return null;
  if (guaranteeType === 'Advance Guarantee') return contractAmount * 0.10;
  if (guaranteeType === 'Performance Guarantee') return contractAmount * 0.05;
  return null; // Bid Bond, Retention, Warranty, Other
};

export const computeComplianceDifference = (guaranteeAmount, expectedAmount) => {
  if (expectedAmount === null || expectedAmount === undefined) return null;
  return guaranteeAmount - expectedAmount;
};

export const computeGuaranteePercentage = (guaranteeAmount, contractAmount) => {
  if (!contractAmount) return null;
  return (guaranteeAmount / contractAmount) * 100;
};

export const computeAlertThreshold = (remainingDays) => {
  if (remainingDays === null || remainingDays < 0) return null;
  if (remainingDays <= 7) return 'critical';
  if (remainingDays <= 15) return 'warning';
  if (remainingDays <= 30) return 'upcoming';
  return null;
};

// ── Chart aggregation helpers ────────────────────────────────────

export const aggregateByType = (guarantees) => {
  const map = {};
  guarantees.forEach((g) => {
    map[g.guaranteeType] = (map[g.guaranteeType] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

export const aggregateByBank = (guarantees) => {
  const map = {};
  guarantees.forEach((g) => {
    map[g.bankName] = (map[g.bankName] || 0) + g.guaranteeAmount;
  });
  return Object.entries(map)
    .map(([bankName, totalAmount]) => ({ bankName, totalAmount }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

export const aggregateExpiryTimeline = (guarantees) => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      count: 0,
    });
  }
  guarantees.forEach((g) => {
    if (!g.expiryDate) return;
    const exp = toDate(g.expiryDate);
    const idx = months.findIndex(
      (m) => m.year === exp.getFullYear() && m.monthNum === exp.getMonth()
    );
    if (idx !== -1) months[idx].count++;
  });
  return months.map(({ month, count }) => ({ month, count }));
};

export const aggregateExposureByType = (guarantees) => {
  const map = {};
  guarantees
    .filter((g) => g.status !== 'Released' && g.status !== 'Claimed')
    .forEach((g) => {
      map[g.guaranteeType] = (map[g.guaranteeType] || 0) + g.guaranteeAmount;
    });
  return Object.entries(map).map(([type, totalAmount]) => ({ type, totalAmount }));
};

// ── Summary card computation ─────────────────────────────────────

export const computeSummary = (guarantees) => {
  let active = 0, expiringSoon = 0, expired = 0, released = 0, exposure = 0;
  guarantees.forEach((g) => {
    const vs = computeVerificationStatus(g);
    if (vs === 'Active') active++;
    else if (vs === 'Expiring Soon') expiringSoon++;
    else if (vs === 'Expired') expired++;
    else if (vs === 'Released') released++;
    if (vs !== 'Released') exposure += g.guaranteeAmount || 0;
  });
  return { total: guarantees.length, active, expiringSoon, expired, released, exposure };
};
