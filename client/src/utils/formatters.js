import { format, parseISO, differenceInDays } from 'date-fns';
import { formatDateBS } from './nepaliDate';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '';
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format a date showing both B.S. and A.D.
 * e.g. "01 Poush 2080 B.S. (15 Jan 2024)"
 */
export const formatDate = (date) => {
  if (!date) return '—';
  try {
    const jsDate = typeof date === 'string' ? parseISO(date) : date;
    const ad = format(jsDate, 'dd MMM yyyy');
    const bs = formatDateBS(jsDate);
    if (bs) return `${bs} (${ad})`;
    return ad;
  } catch {
    return '—';
  }
};

/**
 * Format only the A.D. date (for compact spaces like table cells).
 */
export const formatDateAD = (date) => {
  if (!date) return '—';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM yyyy');
  } catch {
    return '—';
  }
};

export const formatDateInput = (date) => {
  if (!date) return '';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  return differenceInDays(
    typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate,
    new Date()
  );
};

export const getExpiryStatus = (expiryDate) => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days === null) return { label: 'Unknown', color: 'gray' };
  if (days < 0) return { label: 'Expired', color: 'red' };
  if (days <= 7) return { label: `${days}d left`, color: 'red' };
  if (days <= 30) return { label: `${days}d left`, color: 'yellow' };
  return { label: `${days}d left`, color: 'green' };
};

export const getStatusBadgeClass = (status) => {
  const map = {
    Active: 'badge-green',
    Completed: 'badge-blue',
    Expired: 'badge-red',
    Cancelled: 'badge-gray',
    Released: 'badge-blue',
    Claimed: 'badge-yellow',
  };
  return map[status] || 'badge-gray';
};

export const CONTRACT_TYPES = [
  'Bepiyani',
  'Unit Rate',
  'Lump Sum',
  'Cost Plus',
  'Time and Material',
  'Other',
];

export const GUARANTEE_TYPES = [
  'Bid Bond',
  'Performance Guarantee',
  'Advance Guarantee',
  'Retention Guarantee',
  'Warranty Guarantee',
  'Other',
];

export const TENDER_STATUSES = ['Active', 'Completed', 'Expired', 'Cancelled'];
export const GUARANTEE_STATUSES = ['Active', 'Expired', 'Released', 'Claimed'];
