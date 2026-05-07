import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { computeVerificationStatus, computeRemainingDays, computeExpectedAmount, computeComplianceDifference, computeGuaranteePercentage } from './verificationHelpers';

const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'dd MMM yyyy'); } catch { return '—'; }
};

const fmtCurrency = (n) => {
  if (n === null || n === undefined) return '—';
  return `NPR ${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;
};

const buildRows = (guarantees) =>
  guarantees.map((g) => {
    const contractAmount = g.tenderId?.contractAmount || 0;
    const expected = computeExpectedAmount(g.guaranteeType, contractAmount);
    const diff = computeComplianceDifference(g.guaranteeAmount, expected);
    const pct = computeGuaranteePercentage(g.guaranteeAmount, contractAmount);
    const remaining = computeRemainingDays(g.expiryDate);
    const vs = computeVerificationStatus(g);
    return {
      'Bank Name': g.bankName,
      'Guarantee Type': g.guaranteeType,
      'Guarantee No.': g.guaranteeNumber,
      'Contract No.': g.tenderId?.contractNumber || '—',
      'Employer': g.tenderId?.employerOfficeName || '—',
      'Contract Amount': fmtCurrency(contractAmount),
      'Guarantee Amount': fmtCurrency(g.guaranteeAmount),
      'Expected Amount': expected !== null ? fmtCurrency(expected) : g.guaranteeType === 'Bid Bond' ? 'N/A (Tender Security)' : 'N/A',
      'Guarantee %': pct !== null ? `${pct.toFixed(2)}%` : '—',
      'Compliance': diff !== null ? (diff >= 0 ? `✓ Compliant (${fmtCurrency(diff)})` : `✗ Shortfall (${fmtCurrency(diff)})`) : 'N/A',
      'Issued Date': fmtDate(g.issuedDate),
      'Expiry Date': fmtDate(g.expiryDate),
      'Remaining Days': remaining !== null ? (remaining < 0 ? `${remaining} (Overdue)` : String(remaining)) : '—',
      'Status': vs,
    };
  });

export const exportToExcel = (guarantees, userName = '') => {
  const rows = buildRows(guarantees);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guarantees');
  const filename = `guarantee-verification-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportToPDF = (guarantees, userName = '') => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Guarantee Verification Report', 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported by: ${userName}`, 14, 22);
  doc.text(`Date: ${fmtDate(new Date())}`, 14, 27);
  doc.text(`Total Records: ${guarantees.length}`, 14, 32);

  const rows = buildRows(guarantees);
  const headers = Object.keys(rows[0] || {});
  const body = rows.map((r) => headers.map((h) => r[h]));

  autoTable(doc, {
    head: [headers],
    body,
    startY: 38,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`guarantee-verification-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
