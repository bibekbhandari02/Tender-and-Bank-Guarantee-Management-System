import React, { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import {
  formatCurrency,
  formatDate,
  getExpiryStatus,
  getStatusBadgeClass,
} from '../../utils/formatters';
import Modal from '../UI/Modal';
import ConfirmDialog from '../UI/ConfirmDialog';
import GuaranteeForm from './GuaranteeForm';
import EmptyState from '../UI/EmptyState';
import FileViewer from '../UI/FileViewer';
import { guaranteeAPI, uploadAPI } from '../../api/tenders';
import toast from 'react-hot-toast';
import { BuildingLibraryIcon } from '@heroicons/react/24/outline';

const GuaranteeTable = ({ tenderId, guarantees, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGuarantee, setEditGuarantee] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewFilesGuarantee, setViewFilesGuarantee] = useState(null);

  const handleAdd = async ({ fields, pendingFiles }) => {
    setLoading(true);
    try {
      // 1. Create the guarantee record
      const res = await guaranteeAPI.create({ ...fields, tenderId });
      const newId = res.data.data._id;

      // 2. Upload any attached files
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((f) => formData.append('files', f));
        await uploadAPI.uploadGuaranteeFiles(newId, formData);
      }

      toast.success('Bank guarantee added');
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async ({ fields, pendingFiles }) => {
    setLoading(true);
    try {
      // Strip file arrays — files are managed separately via upload endpoints
      const { guaranteeFiles, ...safeFields } = fields;

      // 1. Update guarantee fields only
      await guaranteeAPI.update(editGuarantee._id, safeFields);

      // 2. Upload any newly added files
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((f) => formData.append('files', f));
        await uploadAPI.uploadGuaranteeFiles(editGuarantee._id, formData);
      }

      toast.success('Bank guarantee updated');
      setEditGuarantee(null);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!editGuarantee) return;
    try {
      await uploadAPI.deleteGuaranteeFile(editGuarantee._id, fileId);
      // Refresh the guarantee data so the modal shows updated files
      const res = await guaranteeAPI.getById(editGuarantee._id);
      setEditGuarantee(res.data.data);
      toast.success('File removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleDeleteViewFile = async (fileId) => {
    if (!viewFilesGuarantee) return;
    try {
      await uploadAPI.deleteGuaranteeFile(viewFilesGuarantee._id, fileId);
      // Refresh the guarantee so the modal updates
      const res = await guaranteeAPI.getById(viewFilesGuarantee._id);
      setViewFilesGuarantee(res.data.data);
      onRefresh();
      toast.success('File deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await guaranteeAPI.delete(deleteId);
      toast.success('Bank guarantee deleted');
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Bank Guarantees
          <span className="ml-2 text-sm font-normal text-gray-500">({guarantees.length})</span>
        </h3>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Guarantee
        </button>
      </div>

      {guarantees.length === 0 ? (
        <EmptyState
          icon={BuildingLibraryIcon}
          title="No bank guarantees"
          description="Add bank guarantees linked to this tender"
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add First Guarantee
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Bank</th>
                <th className="table-header">Type</th>
                <th className="table-header">Number</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Issued</th>
                <th className="table-header">Expiry</th>
                <th className="table-header">Status</th>
                <th className="table-header">Docs</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guarantees.map((g) => {
                const expiry = getExpiryStatus(g.expiryDate);
                return (
                  <tr key={g._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-medium text-gray-900">{g.bankName}</td>
                    <td className="table-cell">
                      <span className="badge badge-blue">{g.guaranteeType}</span>
                    </td>
                    <td className="table-cell text-gray-500 font-mono text-xs">{g.guaranteeNumber}</td>
                    <td className="table-cell font-semibold">{formatCurrency(g.guaranteeAmount)}</td>
                    <td className="table-cell text-gray-500">{formatDate(g.issuedDate)}</td>
                    <td className="table-cell">
                      <div>
                        <p className="text-gray-700">{formatDate(g.expiryDate)}</p>
                        <span
                          className={`text-xs font-medium ${
                            expiry.color === 'red'
                              ? 'text-red-600'
                              : expiry.color === 'yellow'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}
                        >
                          {expiry.label}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={getStatusBadgeClass(g.status)}>{g.status}</span>
                    </td>
                    <td className="table-cell">
                      {(g.guaranteeFiles?.length > 0) ? (
                        <button
                          type="button"
                          onClick={() => setViewFilesGuarantee(g)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                          title="View documents"
                        >
                          <PaperClipIcon className="w-3.5 h-3.5" />
                          {g.guaranteeFiles.length}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditGuarantee(g)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(g._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
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

      {/* View Files Modal */}
      <Modal
        isOpen={!!viewFilesGuarantee}
        onClose={() => setViewFilesGuarantee(null)}
        title={`Documents — ${viewFilesGuarantee?.bankName ?? ''}`}
        size="lg"
      >
        {viewFilesGuarantee && (
          <FileViewer
            files={viewFilesGuarantee.guaranteeFiles || []}
            onDelete={handleDeleteViewFile}
            emptyText="No documents uploaded for this guarantee"
          />
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Bank Guarantee" size="lg">
        <GuaranteeForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editGuarantee} onClose={() => setEditGuarantee(null)} title="Edit Bank Guarantee" size="lg">
        {editGuarantee && (
          <GuaranteeForm
            initialData={editGuarantee}
            onSubmit={handleEdit}
            onDeleteFile={handleDeleteFile}
            onCancel={() => setEditGuarantee(null)}
            loading={loading}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Bank Guarantee"
        message="Are you sure you want to delete this bank guarantee? This action cannot be undone."
        loading={loading}
      />
    </div>
  );
};

export default GuaranteeTable;
