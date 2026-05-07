import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { guaranteeAPI } from '../api/tenders';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import { formatCurrency, formatDate, getDaysUntilExpiry, getStatusBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ExpiringGuarantees = () => {
  const [guarantees, setGuarantees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    guaranteeAPI
      .getExpiring(days)
      .then((res) => setGuarantees(res.data.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [days]);

  const getUrgencyClass = (daysLeft) => {
    if (daysLeft <= 7) return 'bg-red-50 border-red-200';
    if (daysLeft <= 14) return 'bg-orange-50 border-orange-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getUrgencyBadge = (daysLeft) => {
    if (daysLeft <= 7) return 'badge-red';
    if (daysLeft <= 14) return 'bg-orange-100 text-orange-800 badge';
    return 'badge-yellow';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expiring Guarantees</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor bank guarantees approaching expiry</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Show next</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="form-input w-28"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critical (≤7d)', count: guarantees.filter(g => getDaysUntilExpiry(g.expiryDate) <= 7).length, color: 'text-red-600 bg-red-50' },
          { label: 'Warning (≤14d)', count: guarantees.filter(g => { const d = getDaysUntilExpiry(g.expiryDate); return d > 7 && d <= 14; }).length, color: 'text-orange-600 bg-orange-50' },
          { label: `Upcoming (≤${days}d)`, count: guarantees.length, color: 'text-yellow-600 bg-yellow-50' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`card p-4 ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner />
      ) : guarantees.length === 0 ? (
        <EmptyState
          icon={CheckCircleIcon}
          title="No expiring guarantees"
          description={`No active guarantees expiring within the next ${days} days`}
        />
      ) : (
        <div className="space-y-3">
          {guarantees.map((g) => {
            const daysLeft = getDaysUntilExpiry(g.expiryDate);
            return (
              <div
                key={g._id}
                className={`card p-4 border ${getUrgencyClass(daysLeft)} animate-fade-in`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <ExclamationTriangleIcon className={`w-5 h-5 ${daysLeft <= 7 ? 'text-red-500' : daysLeft <= 14 ? 'text-orange-500' : 'text-yellow-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`${getUrgencyBadge(daysLeft)}`}>
                          {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                        </span>
                        <span className="badge badge-blue">{g.guaranteeType}</span>
                        <span className={getStatusBadgeClass(g.status)}>{g.status}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{g.bankName}</p>
                      <p className="text-xs text-gray-500 font-mono">{g.guaranteeNumber}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 sm:ml-4">
                    <p className="text-base font-bold text-gray-900">{formatCurrency(g.guaranteeAmount)}</p>
                    <p className="text-xs text-gray-500">Expires: <span className="font-medium text-gray-700">{formatDate(g.expiryDate)}</span></p>
                    {g.tenderId && (
                      <Link
                        to={`/tenders/${g.tenderId._id}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        {g.tenderId.contractNumber}
                        <ArrowRightIcon className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {g.tenderId && (
                  <div className="mt-3 pt-3 border-t border-white/60">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Tender:</span> {g.tenderId.contractTitle} —{' '}
                      <span className="text-gray-500">{g.tenderId.employeeName}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExpiringGuarantees;
