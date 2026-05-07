import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { tenderAPI, guaranteeAPI, uploadAPI } from '../api/tenders';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import GuaranteeTable from '../components/BankGuarantee/GuaranteeTable';
import FileViewer from '../components/UI/FileViewer';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
    {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5 break-words">{value || '—'}</p>
    </div>
  </div>
);

const TenderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [guarantees, setGuarantees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTender = useCallback(async () => {
    try {
      const res = await tenderAPI.getById(id);
      setTender(res.data.data);
    } catch (err) {
      toast.error(err.message);
      navigate('/tenders');
    }
  }, [id, navigate]);

  const fetchGuarantees = useCallback(async () => {
    try {
      const res = await guaranteeAPI.getByTender(id);
      setGuarantees(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetchTender(), fetchGuarantees()]).finally(() => setLoading(false));
  }, [fetchTender, fetchGuarantees]);

  const handleDeleteBidNoticeFile = async (fileId) => {
    try {
      await uploadAPI.deleteBidNoticeFile(id, fileId);
      await fetchTender();
      toast.success('File deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleDeleteContractFile = async (fileId) => {
    try {
      await uploadAPI.deleteContractFile(id, fileId);
      await fetchTender();
      toast.success('File deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleDelete = async () => {    setDeleteLoading(true);
    try {
      await tenderAPI.delete(id);
      toast.success('Tender deleted successfully');
      navigate('/tenders');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading tender details..." />;
  if (!tender) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tenders')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{tender.contractTitle}</h2>
              <span className={getStatusBadgeClass(tender.status)}>{tender.status}</span>
            </div>
            <p className="text-sm text-gray-500 font-mono">{tender.contractNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/tenders/${id}/edit`} className="btn-secondary">
            <PencilIcon className="w-4 h-4" />
            Edit
          </Link>
          <button onClick={() => setShowDelete(true)} className="btn-danger">
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Info */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-primary-600" />
            General Information
          </h3>
          <InfoRow label="Employee / Company" value={tender.employeeName} />
          <InfoRow label="Company Email" value={tender.companyEmail} icon={EnvelopeIcon} />
          <InfoRow label="Employer Office" value={tender.employerOfficeName} />
          <InfoRow label="Employer Email" value={tender.employerEmail} icon={EnvelopeIcon} />
        </div>

        {/* Contract Info */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            Contract Details
          </h3>
          <InfoRow label="Contract Number" value={tender.contractNumber} />
          <InfoRow label="Contract Type" value={tender.contractType} />
          <InfoRow label="Contract Date" value={formatDate(tender.contractDate)} icon={CalendarIcon} />
          <InfoRow
            label="Duration"
            value={`${formatDate(tender.contractStartDate)} → ${formatDate(tender.contractEndDate)}`}
            icon={CalendarIcon}
          />
          {tender.contractExtension && (
            <InfoRow label="Extension" value={formatDate(tender.contractExtension)} />
          )}
          {tender.workDescription && (
            <InfoRow label="Work Description" value={tender.workDescription} />
          )}
        </div>

        {/* Financial Info */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-primary-600" />
            Financial Details
          </h3>
          <InfoRow label="Contract Amount" value={formatCurrency(tender.contractAmount)} />
          <InfoRow
            label="VAT Included"
            value={
              <span className={`badge ${tender.vatIncluded ? 'badge-green' : 'badge-gray'}`}>
                {tender.vatIncluded ? 'Yes' : 'No'}
              </span>
            }
            icon={CheckBadgeIcon}
          />
          <div className="mt-4 p-3 bg-primary-50 rounded-xl">
            <p className="text-xs text-primary-600 font-medium">Total Guarantee Value</p>
            <p className="text-lg font-bold text-primary-700 mt-1">
              {formatCurrency(guarantees.reduce((sum, g) => sum + g.guaranteeAmount, 0))}
            </p>
            <p className="text-xs text-primary-500">{guarantees.length} guarantee(s)</p>
          </div>
        </div>
      </div>

      {/* Bank Guarantees */}
      <div className="card p-5">
        <GuaranteeTable
          tenderId={id}
          guarantees={guarantees}
          onRefresh={fetchGuarantees}
        />
      </div>

      {/* Documents */}
      {(tender.bidNoticeFiles?.length > 0 || tender.contractFiles?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bid Notice Files */}
          {tender.bidNoticeFiles?.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title flex items-center gap-2 mb-4">
                <PaperClipIcon className="w-5 h-5 text-primary-600" />
                Bid Notice Documents
                <span className="ml-auto text-xs font-normal text-gray-400">
                  {tender.bidNoticeFiles.length} file{tender.bidNoticeFiles.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <FileViewer
                files={tender.bidNoticeFiles}
                onDelete={handleDeleteBidNoticeFile}
              />
            </div>
          )}

          {/* Contract Files */}
          {tender.contractFiles?.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title flex items-center gap-2 mb-4">
                <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                Contract Documents
                <span className="ml-auto text-xs font-normal text-gray-400">
                  {tender.contractFiles.length} file{tender.contractFiles.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <FileViewer
                files={tender.contractFiles}
                onDelete={handleDeleteContractFile}
              />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Tender"
        message={`Delete "${tender.contractTitle}" and all ${guarantees.length} associated bank guarantee(s)? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default TenderDetail;
