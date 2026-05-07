import NepaliDate from 'nepali-date-converter';

/**
 * Convert an AD date string (yyyy-MM-dd) or JS Date to BS string (yyyy-MM-dd).
 * Returns '' on failure.
 */
export const adToBS = (adDate) => {
  if (!adDate) return '';
  try {
    const jsDate = typeof adDate === 'string' ? new Date(adDate) : adDate;
    if (isNaN(jsDate.getTime())) return '';
    const nd = new NepaliDate(jsDate);
    return nd.format('YYYY-MM-DD');
  } catch {
    return '';
  }
};

/**
 * Convert a BS date string (yyyy-MM-dd) to AD string (yyyy-MM-dd).
 * Returns '' on failure.
 */
export const bsToAD = (bsDate) => {
  if (!bsDate) return '';
  try {
    const [y, m, d] = bsDate.split('-').map(Number);
    if (!y || !m || !d) return '';
    // NepaliDate(year, month-1, day) — month is 0-indexed
    const nd = new NepaliDate(y, m - 1, d);
    const jsDate = nd.toJsDate();
    if (!jsDate || isNaN(jsDate.getTime())) return '';
    return jsDate.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Format a BS date string (yyyy-MM-dd) to human-readable Nepali format.
 * e.g. "2080-10-01" → "२०८०-१०-०१" or "2080 Poush 01"
 */
const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra',
];

export const formatBS = (bsDate) => {
  if (!bsDate) return '';
  try {
    const [y, m, d] = bsDate.split('-').map(Number);
    if (!y || !m || !d) return '';
    return `${d} ${BS_MONTHS[m - 1]} ${y} B.S.`;
  } catch {
    return '';
  }
};

/**
 * Given an AD ISO string or Date, return a formatted BS string.
 * e.g. "2024-01-15" → "01 Poush 2080 B.S."
 */
export const formatDateBS = (adDate) => {
  const bs = adToBS(adDate);
  return formatBS(bs);
};

/**
 * Validate a BS date string (yyyy-MM-dd).
 * Returns true if valid.
 */
export const isValidBSDate = (bsDate) => {
  if (!bsDate) return false;
  const ad = bsToAD(bsDate);
  return ad !== '';
};

/**
 * Get current date in BS as yyyy-MM-dd string.
 */
export const todayBS = () => adToBS(new Date());
