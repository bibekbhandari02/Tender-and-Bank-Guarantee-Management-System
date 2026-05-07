import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { tenderAPI } from '../api/tenders';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import Pagination from '../components/UI/Pagination';
import {
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  CONTRACT_TYPES,
  TENDER_STATUSES,
} from '../utils/formatters';
import toast from 'react-hot-toast';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import NepaliDateInput from '../components/UI/NepaliDateInput';

const TenderList = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    contractType: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
      );
      const res = await tenderAPI.getAll(params);
      setTenders(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchTenders, 300);
    return () => clearTimeout(timer);
  }, [fetchTenders]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      contractType: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await tenderAPI.delete(deleteId);
      toast.success('Tender deleted successfully');
      setDeleteId(null);
      fetchTenders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasActiveFilters =
    filters.search || filters.status || filters.contractType ||
    filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by contract no., company, title..."
            className="form-input pl-9"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${hasActiveFilters ? 'border-primary-400 text-primary-600' : ''}`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-600 rounded-full" />
            )}
          </button>
          <Link to="/tenders/new" className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            New Tender
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <XMarkIcon className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="form-label">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="form-input">
                <option value="">All Statuses</option>
                {TENDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Contract Type</label>
              <select name="contractType" value={filters.contractType} onChange={handleFilterChange} className="form-input">
                <option value="">All Types</option>
                {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">From Date</label>
              <NepaliDateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </div>
            <div>
              <label className="form-label">To Date</label>
              <NepaliDateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>
            <div>
              <label className="form-label">Min Amount</label>
              <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange} placeholder="0" className="form-input" />
            </div>
            <div>
              <label className="form-label">Max Amount</label>
              <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} placeholder="Any" className="form-input" />
            </div>
            <div>
              <label className="form-label">Sort By</label>
              <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="form-input">
                <option value="createdAt">Date Created</option>
                <option value="contractDate">Contract Date</option>
                <option value="contractAmount">Amount</option>
                <option value="contractNumber">Contract No.</option>
              </select>
            </div>
            <div>
              <label className="form-label">Order</label>
              <select name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange} className="form-input">
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : tenders.length === 0 ? (
          <EmptyState
            icon={DocumentTextIcon}
            title="No tenders found"
            description={hasActiveFilters ? 'Try adjusting your filters' : 'Create your first tender to get started'}
            action={
              !hasActiveFilters && (
                <Link to="/tenders/new" className="btn-primary">
                  <PlusIcon className="w-4 h-4" />
                  Create Tender
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">Contract No.</th>
                    <th className="table-header">Employer</th>
                    <th className="table-header">Project Title</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Duration</th>
                    <th className="table-header">Guarantees</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenders.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <Link
                          to={`/tenders/${t._id}`}
                          className="font-mono text-xs text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          {t.contractNumber}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{t.employeeName}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{t.employerOfficeName}</p>
                        </div>
                      </td>
                      <td className="table-cell max-w-[200px]">
                        <p className="truncate font-medium text-gray-800">{t.contractTitle}</p>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-blue">{t.contractType}</span>
                      </td>
                      <td className="table-cell font-semibold text-gray-900">
                        {formatCurrency(t.contractAmount)}
                        {t.vatIncluded && (
                          <span className="ml-1 text-xs text-green-600 font-normal">+VAT</span>
                        )}
                      </td>
                      <td className="table-cell text-gray-500 text-xs">
                        <div>
                          <p>{formatDate(t.contractStartDate)}</p>
                          <p>{formatDate(t.contractEndDate)}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-gray">
                          {t.bankGuarantees?.length || 0}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/tenders/${t._id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/tenders/${t._id}/edit`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(t._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Tender"
        message="This will permanently delete the tender and all associated bank guarantees. This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
};

export default TenderList;
