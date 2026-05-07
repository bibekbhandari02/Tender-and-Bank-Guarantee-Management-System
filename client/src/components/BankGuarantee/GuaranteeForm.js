import React, { useState } from 'react';
import { GUARANTEE_TYPES, GUARANTEE_STATUSES, formatDateInput } from '../../utils/formatters';
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
  bankName: '',
  guaranteeType: '',
  guaranteeNumber: '',
  guaranteeAmount: '',
  issuedDate: '',
  expiryDate: '',
  remarks: '',
  status: 'Active',
};

/**
 * GuaranteeForm
 *
 * Props:
 *   initialData          – existing guarantee object (edit mode)
 *   onSubmit(payload)    – called with { fields, pendingFiles }
 *   onDeleteFile(fileId) – called when user removes an already-uploaded file (edit mode)
 *   onCancel()
 *   loading
 */
const GuaranteeForm = ({ initialData, onSubmit, onDeleteFile, onCancel, loading }) => {
  const [form, setForm] = useState(() => {
    if (!initialData) return initialState;
    return {
      ...initialData,
      issuedDate: formatDateInput(initialData.issuedDate),
      expiryDate: formatDateInput(initialData.expiryDate),
      guaranteeAmount: initialData.guaranteeAmount?.toString() || '',
    };
  });

  const [errors, setErrors] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState(
    () => initialData?.guaranteeFiles || []
  );

  React.useEffect(() => {
    setExistingFiles(initialData?.guaranteeFiles || []);
  }, [initialData?.guaranteeFiles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setForm((prev) => ({ ...prev, guaranteeAmount: raw }));
    if (errors.guaranteeAmount) setErrors((prev) => ({ ...prev, guaranteeAmount: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.bankName.trim()) errs.bankName = 'Required';
    if (!form.guaranteeType) errs.guaranteeType = 'Required';
    if (!form.guaranteeNumber.trim()) errs.guaranteeNumber = 'Required';
    if (!form.guaranteeAmount) errs.guaranteeAmount = 'Required';
    else if (isNaN(Number(form.guaranteeAmount)) || Number(form.guaranteeAmount) < 0) {
      errs.guaranteeAmount = 'Must be a positive number';
    }
    if (!form.issuedDate) errs.issuedDate = 'Required';
    if (!form.expiryDate) errs.expiryDate = 'Required';
    if (form.issuedDate && form.expiryDate && form.expiryDate <= form.issuedDate) {
      errs.expiryDate = 'Expiry must be after issued date';
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
    onSubmit({
      fields: { ...form, guaranteeAmount: Number(form.guaranteeAmount) },
      pendingFiles,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Bank Name" name="bankName" required error={errors.bankName}>
          <input
            type="text"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            placeholder="e.g. Nepal Bank Limited"
            className={`form-input ${errors.bankName ? 'border-red-400' : ''}`}
          />
        </Field>

        <Field label="Guarantee Type" name="guaranteeType" required error={errors.guaranteeType}>
          <select
            name="guaranteeType"
            value={form.guaranteeType}
            onChange={handleChange}
            className={`form-input ${errors.guaranteeType ? 'border-red-400' : ''}`}
          >
            <option value="">Select type</option>
            {GUARANTEE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Guarantee Number" name="guaranteeNumber" required error={errors.guaranteeNumber}>
          <input
            type="text"
            name="guaranteeNumber"
            value={form.guaranteeNumber}
            onChange={handleChange}
            placeholder="e.g. BG-2024-001"
            className={`form-input ${errors.guaranteeNumber ? 'border-red-400' : ''}`}
          />
        </Field>

        <Field label="Guarantee Amount (NPR)" name="guaranteeAmount" required error={errors.guaranteeAmount}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">NPR</span>
            <input
              type="text"
              name="guaranteeAmount"
              value={form.guaranteeAmount ? Number(form.guaranteeAmount).toLocaleString('en-IN') : ''}
              onChange={handleAmountChange}
              placeholder="0"
              className={`form-input pl-12 ${errors.guaranteeAmount ? 'border-red-400' : ''}`}
            />
          </div>
        </Field>

        <Field label="Issued Date" name="issuedDate" required error={errors.issuedDate}>
          <NepaliDateInput
            name="issuedDate"
            value={form.issuedDate}
            onChange={handleChange}
            hasError={!!errors.issuedDate}
          />
        </Field>

        <Field label="Expiry Date" name="expiryDate" required error={errors.expiryDate}>
          <NepaliDateInput
            name="expiryDate"
            value={form.expiryDate}
            onChange={handleChange}
            hasError={!!errors.expiryDate}
          />
        </Field>

        <Field label="Status" name="status">
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="form-input"
          >
            {GUARANTEE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <label className="form-label">Remarks</label>
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows={2}
            placeholder="Optional remarks..."
            className="form-input resize-none"
          />
        </div>

        {/* ── Guarantee File Upload ── */}
        <div className="sm:col-span-2">
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-3">Guarantee Documents</p>

            {/* Already-uploaded files (edit mode) */}
            {existingFiles.length > 0 && (
              <div className="mb-3">
                <FileViewer
                  files={existingFiles}
                  onDelete={onDeleteFile}
                  emptyText=""
                />
              </div>
            )}

            <FileUpload
              multiple
              existingFiles={[]}
              pendingFiles={pendingFiles}
              onAddFiles={(files) => setPendingFiles((prev) => [...prev, ...files])}
              onRemovePending={(idx) =>
                setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            initialData ? 'Update Guarantee' : 'Add Guarantee'
          )}
        </button>
      </div>
    </form>
  );
};

export default GuaranteeForm;
