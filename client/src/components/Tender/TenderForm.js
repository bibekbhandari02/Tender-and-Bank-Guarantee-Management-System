import React, { useState } from 'react';
import { CONTRACT_TYPES, TENDER_STATUSES, formatDateInput } from '../../utils/formatters';
import FileUpload from '../UI/FileUpload';
import FileViewer from '../UI/FileViewer';
import NepaliDateInput from '../UI/NepaliDateInput';

// Defined outside the component so it's never recreated on re-render
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
);

const initialState = {
  employeeName: '',
  companyEmail: '',
  employerOfficeName: '',
  employerEmail: '',
  contractNumber: '',
  contractTitle: '',
  workDescription: '',
  contractDate: '',
  contractType: '',
  contractStartDate: '',
  contractEndDate: '',
  contractExtension: '',
  contractAmount: '',
  vatIncluded: false,
  status: 'Active',
};

/**
 * TenderForm
 *
 * Props:
 *   initialData        – existing tender object (edit mode)
 *   onSubmit(payload)  – called with { fields, pendingBidNoticeFiles }
 *   onDeleteBidNoticeFile(fileId) – called when user removes an already-uploaded file (edit mode)
 *   loading            – disables submit button
 */
const TenderForm = ({ initialData, onSubmit, onDeleteBidNoticeFile, loading }) => {
  const [form, setForm] = useState(() => {
    if (!initialData) return initialState;
    return {
      ...initialData,
      contractDate: formatDateInput(initialData.contractDate),
      contractStartDate: formatDateInput(initialData.contractStartDate),
      contractEndDate: formatDateInput(initialData.contractEndDate),
      contractExtension: formatDateInput(initialData.contractExtension),
      contractAmount: initialData.contractAmount?.toString() || '',
    };
  });

  const [errors, setErrors] = useState({});

  // Bid notice file state
  const [pendingBidNoticeFiles, setPendingBidNoticeFiles] = useState([]);
  // Track existing files in local state so deletions reflect immediately without remounting
  const [existingBidNoticeFiles, setExistingBidNoticeFiles] = useState(
    () => initialData?.bidNoticeFiles || []
  );

  // Keep existing files in sync if parent refreshes initialData (e.g. after delete)
  React.useEffect(() => {
    setExistingBidNoticeFiles(initialData?.bidNoticeFiles || []);
  }, [initialData?.bidNoticeFiles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setForm((prev) => ({ ...prev, contractAmount: raw }));
    if (errors.contractAmount) setErrors((prev) => ({ ...prev, contractAmount: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.employeeName.trim()) errs.employeeName = 'Required';
    if (!form.companyEmail.trim()) errs.companyEmail = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(form.companyEmail)) errs.companyEmail = 'Invalid email';
    if (!form.employerOfficeName.trim()) errs.employerOfficeName = 'Required';
    if (!form.employerEmail.trim()) errs.employerEmail = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(form.employerEmail)) errs.employerEmail = 'Invalid email';
    if (!form.contractNumber.trim()) errs.contractNumber = 'Required';
    if (!form.contractTitle.trim()) errs.contractTitle = 'Required';
    if (!form.contractDate) errs.contractDate = 'Required';
    if (!form.contractType) errs.contractType = 'Required';
    if (!form.contractStartDate) errs.contractStartDate = 'Required';
    if (!form.contractEndDate) errs.contractEndDate = 'Required';
    if (form.contractStartDate && form.contractEndDate && form.contractEndDate <= form.contractStartDate) {
      errs.contractEndDate = 'End date must be after start date';
    }
    if (!form.contractAmount) errs.contractAmount = 'Required';
    else if (isNaN(Number(form.contractAmount)) || Number(form.contractAmount) < 0) {
      errs.contractAmount = 'Must be a positive number';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const fields = {
      ...form,
      contractAmount: Number(form.contractAmount),
      contractExtension: form.contractExtension || null,
    };
    onSubmit({ fields, pendingBidNoticeFiles });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Information */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          General Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Employee / Company Name" name="employeeName" required error={errors.employeeName}>
            <input
              type="text"
              name="employeeName"
              value={form.employeeName}
              onChange={handleChange}
              placeholder="Enter company name"
              className={`form-input ${errors.employeeName ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </Field>

          <Field label="Company Email" name="companyEmail" required error={errors.companyEmail}>
            <input
              type="email"
              name="companyEmail"
              value={form.companyEmail}
              onChange={handleChange}
              placeholder="company@example.com"
              className={`form-input ${errors.companyEmail ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </Field>

          <Field label="Employer Office Name" name="employerOfficeName" required error={errors.employerOfficeName}>
            <input
              type="text"
              name="employerOfficeName"
              value={form.employerOfficeName}
              onChange={handleChange}
              placeholder="नियोक्ता कार्यालयको नाम / Employer Office Name"
              className={`form-input ${errors.employerOfficeName ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </Field>

          <Field label="Employer Email" name="employerEmail" required error={errors.employerEmail}>
            <input
              type="email"
              name="employerEmail"
              value={form.employerEmail}
              onChange={handleChange}
              placeholder="employer@example.com"
              className={`form-input ${errors.employerEmail ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </Field>
        </div>
      </section>

      {/* Contract Details */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Contract Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Contract Number" name="contractNumber" required error={errors.contractNumber}>
            <input
              type="text"
              name="contractNumber"
              value={form.contractNumber}
              onChange={handleChange}
              placeholder="e.g. CTR-2024-001"
              className={`form-input ${errors.contractNumber ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </Field>

          <Field label="Contract Date" name="contractDate" required error={errors.contractDate}>
            <NepaliDateInput
              name="contractDate"
              value={form.contractDate}
              onChange={handleChange}
              hasError={!!errors.contractDate}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Contract Title / Work Description" name="contractTitle" required error={errors.contractTitle}>
              <input
                type="text"
                name="contractTitle"
                value={form.contractTitle}
                onChange={handleChange}
                placeholder="Enter contract title"
                className={`form-input ${errors.contractTitle ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Work Description (Details)</label>
            <textarea
              name="workDescription"
              value={form.workDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Detailed description of the work..."
              className="form-input resize-none"
            />
          </div>

          <Field label="Contract Type" name="contractType" required error={errors.contractType}>
            <select
              name="contractType"
              value={form.contractType}
              onChange={handleChange}
              className={`form-input ${errors.contractType ? 'border-red-400 focus:ring-red-400' : ''}`}
            >
              <option value="">Select contract type</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Status" name="status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="form-input"
            >
              {TENDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Contract Start Date" name="contractStartDate" required error={errors.contractStartDate}>
            <NepaliDateInput
              name="contractStartDate"
              value={form.contractStartDate}
              onChange={handleChange}
              hasError={!!errors.contractStartDate}
            />
          </Field>

          <Field label="Contract End Date" name="contractEndDate" required error={errors.contractEndDate}>
            <NepaliDateInput
              name="contractEndDate"
              value={form.contractEndDate}
              onChange={handleChange}
              hasError={!!errors.contractEndDate}
            />
          </Field>

          <Field label="Contract Extension (Optional)" name="contractExtension" error={errors.contractExtension}>
            <NepaliDateInput
              name="contractExtension"
              value={form.contractExtension}
              onChange={handleChange}
            />
          </Field>

          {/* ── Bid Notice Upload ── */}
          <div className="md:col-span-2 pt-2">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-3">Bid Notice Documents</p>

              {/* Already-uploaded files (edit mode) */}
              {existingBidNoticeFiles.length > 0 && (
                <div className="mb-3">
                  <FileViewer
                    files={existingBidNoticeFiles}
                    onDelete={onDeleteBidNoticeFile}
                    emptyText=""
                  />
                </div>
              )}

              <FileUpload
                multiple
                existingFiles={[]}
                pendingFiles={pendingBidNoticeFiles}
                onAddFiles={(files) => setPendingBidNoticeFiles((prev) => [...prev, ...files])}
                onRemovePending={(idx) =>
                  setPendingBidNoticeFiles((prev) => prev.filter((_, i) => i !== idx))
                }
              />

              {initialData && pendingBidNoticeFiles.length === 0 && existingBidNoticeFiles.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">No bid notice files yet. Add files above.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Financial Details */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Financial Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Contract Amount (NPR)" name="contractAmount" required error={errors.contractAmount}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                NPR
              </span>
              <input
                type="text"
                name="contractAmount"
                value={form.contractAmount ? Number(form.contractAmount).toLocaleString('en-IN') : ''}
                onChange={handleAmountChange}
                placeholder="0"
                className={`form-input pl-12 ${errors.contractAmount ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
            </div>
          </Field>

          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer mt-5">
              <div className="relative">
                <input
                  type="checkbox"
                  name="vatIncluded"
                  checked={form.vatIncluded}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    form.vatIncluded ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.vatIncluded ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">VAT Included</span>
            </label>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={() => window.history.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            initialData ? 'Update Tender' : 'Create Tender'
          )}
        </button>
      </div>
    </form>
  );
};

export default TenderForm;
