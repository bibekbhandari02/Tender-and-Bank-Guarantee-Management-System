import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon, FunnelIcon, XMarkIcon,
  ArrowDownTrayIcon, DocumentArrowDownIcon,
  ShieldCheckIcon, ExclamationTriangleIcon,
  ChevronUpIcon, ChevronDownIcon, PaperClipIcon,
  EyeIcon, PencilIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { verificationAPI, guaranteeAPI, uploadAPI } from '../api/tenders';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import FileViewer from '../components/UI/FileViewer';
import GuaranteeForm from '../components/BankGuarantee/GuaranteeForm';
import { formatCurrency, formatDateAD, GUARANTEE_TYPES } from '../utils/formatters';
import {
  computeVerificationStatus, computeRemainingDays,
  computeExpectedAmount, computeComplianceDifference, computeGuaranteePercentage,
  computeAlertThreshold, computeSummary,
  aggregateByType, aggregateByBank, aggregateExpiryTimeline, aggregateExposureByType,
} from '../utils/verificationHelpers';
import { exportToExcel, exportToPDF } from '../utils/verificationExport';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────
const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];
const STATUS_COLORS = { Active: '#10b981', 'Expiring Soon': '#f59e0b', Expired: '#ef4444', Released: '#94a3b8' };
const ALERT_COLORS = { critical: 'border-red-500 bg-red-50', warning: 'border-orange-400 bg-orange-50', upcoming: 'border-yellow-400 bg-yellow-50' };

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#f1f5f9' },
};

// ── Status badge ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cls = {
    Active: 'bg-green-100 text-green-800',
    'Expiring Soon': 'bg-yellow-100 text-yellow-800',
    Expired: 'bg-red-100 text-red-800',
    Released: 'bg-gray-100 text-gray-600',
  }[status] || 'bg-gray-100 text-gray-600';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
};

// ── Summary card ─────────────────────────────────────────────────
const SummaryCard = ({ title, value, sub, color }) => {
  const bg = { blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', yellow:'bg-yellow-50 text-yellow-700', red:'bg-red-50 text-red-600', gray:'bg-gray-100 text-gray-600', purple:'bg-purple-50 text-purple-600' }[color] || 'bg-gray-50 text-gray-600';
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      <div className={`mt-2 h-1 rounded-full ${bg.split(' ')[0]}`} />
    </div>
  );
};

// ── Sort icon ────────────────────────────────────────────────────
const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <ChevronUpIcon className="w-3 h-3 text-gray-300 inline ml-1" />;
  return sortOrder === 'asc'
    ? <ChevronUpIcon className="w-3 h-3 text-primary-600 inline ml-1" />
    : <ChevronDownIcon className="w-3 h-3 text-primary-600 inline ml-1" />;
};

// ── Detail Modal ─────────────────────────────────────────────────
const DetailModal = ({ guarantee: g, onClose, onEdit }) => {
  if (!g) return null;
  const contractAmount = g.tenderId?.contractAmount || 0;
  const vs = computeVerificationStatus(g);
  const remaining = computeRemainingDays(g.expiryDate);
  const expected = computeExpectedAmount(g.guaranteeType, contractAmount);
  const diff = computeComplianceDifference(g.guaranteeAmount, expected);
  const pct = computeGuaranteePercentage(g.guaranteeAmount, contractAmount);

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right max-w-xs">{value || '—'}</span>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="Guarantee Verification Detail" size="xl">
      <div className="space-y-6">
        {/* Status banner */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${
          vs === 'Active' ? 'bg-green-50 border border-green-200' :
          vs === 'Expiring Soon' ? 'bg-yellow-50 border border-yellow-200' :
          vs === 'Expired' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <StatusBadge status={vs} />
          <span className={`text-sm font-semibold ${remaining !== null && remaining < 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {remaining !== null ? (remaining < 0 ? `${Math.abs(remaining)} days overdue` : `${remaining} days remaining`) : '—'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guarantee info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-primary-600" /> Guarantee Information
            </h4>
            <Row label="Bank" value={g.bankName} />
            <Row label="Type" value={g.guaranteeType} />
            <Row label="Number" value={g.guaranteeNumber} />
            <Row label="Amount" value={formatCurrency(g.guaranteeAmount)} />
            <Row label="Issued" value={formatDateAD(g.issuedDate)} />
            <Row label="Expiry" value={formatDateAD(g.expiryDate)} />
            <Row label="Status" value={<StatusBadge status={vs} />} />
            {g.remarks && <Row label="Remarks" value={g.remarks} />}
          </div>

          {/* Contract info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Contract Information</h4>
            <Row label="Contract No." value={g.tenderId?.contractNumber} />
            <Row label="Title" value={g.tenderId?.contractTitle} />
            <Row label="Employer" value={g.tenderId?.employerOfficeName} />
            <Row label="Contract Amount" value={formatCurrency(contractAmount)} />
          </div>
        </div>

        {/* Financial comparison */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Comparison</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Guarantee Amount</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(g.guaranteeAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Expected Amount</p>
              <p className="text-base font-bold text-gray-900">
                {expected !== null ? formatCurrency(expected) : g.guaranteeType === 'Bid Bond' ? 'N/A' : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Guarantee %</p>
              <p className="text-base font-bold text-gray-900">{pct !== null ? `${pct.toFixed(2)}%` : '—'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Compliance</p>
              {diff !== null ? (
                <p className={`text-base font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {diff >= 0 ? '✓ Compliant' : '✗ Shortfall'}
                </p>
              ) : <p className="text-base font-bold text-gray-400">N/A</p>}
            </div>
          </div>
          {diff !== null && (
            <p className={`text-xs mt-2 text-center ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Difference: {formatCurrency(Math.abs(diff))} {diff >= 0 ? 'above' : 'below'} expected
            </p>
          )}
        </div>

        {/* Documents */}
        {g.guaranteeFiles?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Documents</h4>
            <FileViewer files={g.guaranteeFiles} />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => onEdit(g)} className="btn-secondary">
            <PencilIcon className="w-4 h-4" /> Edit
          </button>
          <button type="button" onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    </Modal>
  );
};

// ── Main Page ────────────────────────────────────────────────────
const GuaranteeVerification = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]); // unfiltered for charts/summary
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(() => sessionStorage.getItem('verif_alert_dismissed') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState(null);
  const [editGuarantee, setEditGuarantee] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [viewDocsGuarantee, setViewDocsGuarantee] = useState(null);

  const [filters, setFilters] = useState({
    search: '', type: '', bankName: '', status: '', expiryFrom: '', expiryTo: '',
  });
  const [sort, setSort] = useState({ sortBy: 'expiryDate', sortOrder: 'asc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // Fetch all data (for charts/summary) once
  const fetchAll = useCallback(async () => {
    try {
      const res = await verificationAPI.getGuarantees({ limit: 1000, page: 1, sortBy: 'expiryDate', sortOrder: 'asc' });
      setAllData(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  // Fetch paginated/filtered data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        ...sort,
        page: pagination.page,
        limit: pagination.limit,
      };
      // Remove empty params
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await verificationAPI.getGuarantees(params);
      setData(res.data.data || []);
      setMeta({ total: res.data.total, page: res.data.page, totalPages: res.data.totalPages });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, pagination]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (field) => {
    setSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', type: '', bankName: '', status: '', expiryFrom: '', expiryTo: '' });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleEditSubmit = async ({ fields }) => {
    setEditLoading(true);
    try {
      const { guaranteeFiles, ...safeFields } = fields;
      await guaranteeAPI.update(editGuarantee._id, safeFields);
      toast.success('Guarantee updated');
      setEditGuarantee(null);
      fetchData();
      fetchAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const summary = computeSummary(allData);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  // Alert counts
  const alertCounts = { critical: 0, warning: 0, upcoming: 0 };
  allData.forEach((g) => {
    const r = computeRemainingDays(g.expiryDate);
    if (r !== null && r >= 0) {
      const t = computeAlertThreshold(r);
      if (t) alertCounts[t]++;
    }
  });
  const hasAlerts = alertCounts.critical + alertCounts.warning + alertCounts.upcoming > 0;

  // Distinct filter options
  const bankOptions = [...new Set(allData.map((g) => g.bankName).filter(Boolean))].sort();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
            Bank Guarantee Verification
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Verify validity, track APG/BB/PB, compare against contract values</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCharts((v) => !v)}
            className="btn-secondary text-xs"
          >
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
          <button
            type="button"
            onClick={() => exportToExcel(data, user?.name)}
            disabled={data.length === 0}
            className="btn-secondary text-xs disabled:opacity-40"
            title={data.length === 0 ? 'No data to export' : 'Export to Excel'}
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Excel
          </button>
          <button
            type="button"
            onClick={() => exportToPDF(data, user?.name)}
            disabled={data.length === 0}
            className="btn-secondary text-xs disabled:opacity-40"
            title={data.length === 0 ? 'No data to export' : 'Export to PDF'}
          >
            <DocumentArrowDownIcon className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Expiry Alert Banner */}
      {hasAlerts && !alertDismissed && (
        <div className="card p-4 border-l-4 border-yellow-400 bg-yellow-50 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Guarantee Expiry Alerts</p>
              <div className="flex flex-wrap gap-3 mt-1">
                {alertCounts.critical > 0 && <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">🔴 Critical (≤7d): {alertCounts.critical}</span>}
                {alertCounts.warning > 0 && <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">🟠 Warning (≤15d): {alertCounts.warning}</span>}
                {alertCounts.upcoming > 0 && <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">🟡 Upcoming (≤30d): {alertCounts.upcoming}</span>}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => { setAlertDismissed(true); sessionStorage.setItem('verif_alert_dismissed', 'true'); }} className="text-yellow-600 hover:text-yellow-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard title="Total" value={summary.total} color="blue" />
        <SummaryCard title="Active" value={summary.active} color="green" />
        <SummaryCard title="Expiring Soon" value={summary.expiringSoon} color="yellow" />
        <SummaryCard title="Expired" value={summary.expired} color="red" />
        <SummaryCard title="Released" value={summary.released} color="gray" />
        <SummaryCard title="Total Exposure" value={formatCurrency(summary.exposure)} sub="Non-released" color="purple" />
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Distribution by Type</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={aggregateByType(allData)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {aggregateByType(allData).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Exposure by Bank (NPR)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={aggregateByBank(allData)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(0)}K`} />
                <YAxis type="category" dataKey="bankName" tick={{ fontSize: 10 }} width={100} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="totalAmount" name="Amount" fill="#3b82f6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Expiry Timeline (Next 12 Months)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={aggregateExpiryTimeline(allData)} margin={{ left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Expiring" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Financial Exposure by Type</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={aggregateExposureByType(allData)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(0)}K`} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={110} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="totalAmount" name="Exposure" fill="#8b5cf6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange}
              placeholder="Search by guarantee no., contract no., employer..."
              className="form-input pl-9" />
          </div>
          <button type="button" onClick={() => setShowFilters((v) => !v)}
            className={`btn-secondary ${activeFilters > 0 ? 'border-primary-400 text-primary-600' : ''}`}>
            <FunnelIcon className="w-4 h-4" />
            Filters {activeFilters > 0 && <span className="w-5 h-5 bg-primary-600 text-white rounded-full text-xs flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="card p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Filters</p>
              <button type="button" onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <XMarkIcon className="w-3.5 h-3.5" /> Clear all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="form-label">Type</label>
                <select name="type" value={filters.type} onChange={handleFilterChange} className="form-input">
                  <option value="">All Types</option>
                  {GUARANTEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Bank</label>
                <select name="bankName" value={filters.bankName} onChange={handleFilterChange} className="form-input">
                  <option value="">All Banks</option>
                  {bankOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="form-input">
                  <option value="">All Statuses</option>
                  {['Active','Expired','Released','Claimed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Expiry From</label>
                <input type="date" name="expiryFrom" value={filters.expiryFrom} onChange={handleFilterChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Expiry To</label>
                <input type="date" name="expiryTo" value={filters.expiryTo} onChange={handleFilterChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Page Size</label>
                <select value={pagination.limit} onChange={(e) => setPagination({ page: 1, limit: Number(e.target.value) })} className="form-input">
                  {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : data.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No guarantees found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    ['bankName','Bank'],['guaranteeType','Type'],['guaranteeNumber','Guarantee No.'],
                    ['contractNumber','Contract No.'],['employer','Employer'],
                    ['contractAmount','Contract Amt'],['guaranteeAmount','Guarantee Amt'],
                    ['issuedDate','Issued'],['expiryDate','Expiry'],['remaining','Days Left'],
                    ['status','Status'],['docs','Docs'],['actions','Actions'],
                  ].map(([field, label]) => (
                    <th key={field}
                      className={`table-header whitespace-nowrap ${['docs','actions','employer','contractNumber'].includes(field) ? '' : 'cursor-pointer hover:bg-gray-100'}`}
                      onClick={() => !['docs','actions','employer','contractNumber'].includes(field) && handleSort(field)}>
                      {label}
                      {!['docs','actions','employer','contractNumber'].includes(field) && <SortIcon field={field} sortBy={sort.sortBy} sortOrder={sort.sortOrder} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((g) => {
                  const vs = computeVerificationStatus(g);
                  const remaining = computeRemainingDays(g.expiryDate);
                  const threshold = computeAlertThreshold(remaining);
                  const contractAmount = g.tenderId?.contractAmount || 0;
                  const expected = computeExpectedAmount(g.guaranteeType, contractAmount);
                  const diff = computeComplianceDifference(g.guaranteeAmount, expected);
                  const borderClass = threshold === 'critical' ? 'border-l-4 border-l-red-500' : threshold === 'warning' ? 'border-l-4 border-l-orange-400' : threshold === 'upcoming' ? 'border-l-4 border-l-yellow-400' : '';
                  return (
                    <tr key={g._id} className={`hover:bg-gray-50 transition-colors ${borderClass}`}>
                      <td className="table-cell font-medium text-gray-900 whitespace-nowrap">{g.bankName}</td>
                      <td className="table-cell">
                        <span className="badge badge-blue text-xs">{g.guaranteeType}</span>
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-600">{g.guaranteeNumber}</td>
                      <td className="table-cell font-mono text-xs text-primary-600">{g.tenderId?.contractNumber || '—'}</td>
                      <td className="table-cell text-gray-600 text-xs max-w-[120px] truncate">{g.tenderId?.employerOfficeName || '—'}</td>
                      <td className="table-cell text-right font-medium">{formatCurrency(contractAmount)}</td>
                      <td className="table-cell text-right font-semibold">
                        <div>{formatCurrency(g.guaranteeAmount)}</div>
                        {diff !== null && (
                          <div className={`text-xs ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff >= 0 ? '✓' : '✗'} {((g.guaranteeAmount / contractAmount) * 100).toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-gray-500 text-xs whitespace-nowrap">{formatDateAD(g.issuedDate)}</td>
                      <td className="table-cell text-gray-500 text-xs whitespace-nowrap">{formatDateAD(g.expiryDate)}</td>
                      <td className="table-cell text-center">
                        {remaining !== null ? (
                          <span className={`text-xs font-semibold ${remaining < 0 ? 'text-red-600' : remaining <= 7 ? 'text-red-500' : remaining <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {remaining < 0 ? `${remaining}d` : `${remaining}d`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell"><StatusBadge status={vs} /></td>
                      <td className="table-cell text-center">
                        {g.guaranteeFiles?.length > 0 ? (
                          <button type="button" onClick={() => setViewDocsGuarantee(g)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100">
                            <PaperClipIcon className="w-3.5 h-3.5" />{g.guaranteeFiles.length}
                          </button>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setSelectedGuarantee(g)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="View Details">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setEditGuarantee(g)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors" title="Edit">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {((meta.page - 1) * pagination.limit) + 1}–{Math.min(meta.page * pagination.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={meta.page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-3 py-1.5 text-sm text-gray-700">{meta.page} / {meta.totalPages}</span>
              <button type="button" onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={meta.page === meta.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedGuarantee && (
        <DetailModal
          guarantee={selectedGuarantee}
          onClose={() => setSelectedGuarantee(null)}
          onEdit={(g) => { setSelectedGuarantee(null); setEditGuarantee(g); }}
        />
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editGuarantee} onClose={() => setEditGuarantee(null)} title="Edit Bank Guarantee" size="lg">
        {editGuarantee && (
          <GuaranteeForm
            initialData={editGuarantee}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditGuarantee(null)}
            loading={editLoading}
          />
        )}
      </Modal>

      {/* Docs Modal */}
      <Modal isOpen={!!viewDocsGuarantee} onClose={() => setViewDocsGuarantee(null)}
        title={`Documents — ${viewDocsGuarantee?.bankName ?? ''}`} size="lg">
        {viewDocsGuarantee && (
          <FileViewer files={viewDocsGuarantee.guaranteeFiles || []} emptyText="No documents uploaded" />
        )}
      </Modal>
    </div>
  );
};

export default GuaranteeVerification;
