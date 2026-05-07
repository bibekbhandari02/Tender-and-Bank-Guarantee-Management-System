import React, { useRef, useState } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXT = '.pdf,.jpg,.jpeg,.png';

const FileUpload = ({
  label,
  multiple = true,
  existingFiles = [],
  pendingFiles = [],
  onAddFiles,
  onRemovePending,
  onDeleteExisting,
  uploading = false,
  uploadProgress = 0,
  disabled = false,
}) => {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);

  const validateFiles = (files) => {
    const valid = [];
    const errs = [];
    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errs.push(`"${file.name}" — unsupported format. Use PDF, JPG, or PNG.`);
      } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errs.push(`"${file.name}" — exceeds ${MAX_SIZE_MB}MB limit.`);
      } else {
        valid.push(file);
      }
    });
    setErrors(errs);
    return valid;
  };

  const handleFiles = (files) => {
    const valid = validateFiles(files);
    if (valid.length > 0) onAddFiles(valid);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const isPdf = (fileType) => fileType === 'application/pdf' || fileType?.includes('pdf');
  const isImage = (fileType) => fileType?.startsWith('image/');

  const FileIcon = ({ fileType, className = 'w-5 h-5' }) =>
    isImage(fileType) ? (
      <PhotoIcon className={`${className} text-blue-500`} />
    ) : (
      <DocumentIcon className={`${className} text-red-500`} />
    );

  return (
    <div className="space-y-3">
      {label && <label className="form-label">{label}</label>}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={ALLOWED_EXT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
        <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">
          {dragOver ? 'Drop files here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max {MAX_SIZE_MB}MB each</p>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600 flex items-center gap-1">
              <XMarkIcon className="w-3.5 h-3.5 flex-shrink-0" /> {e}
            </p>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pending files (not yet uploaded) */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Ready to upload ({pendingFiles.length})
          </p>
          {pendingFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <FileIcon fileType={file.type} />
              <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
              <button
                type="button"
                onClick={() => onRemovePending(idx)}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Existing uploaded files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Uploaded ({existingFiles.length})
          </p>
          {existingFiles.map((file) => (
            <div key={file._id} className="flex items-center gap-3 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <FileIcon fileType={file.file_type} />
              <span className="text-sm text-gray-700 flex-1 truncate">{file.file_name}</span>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Download / View"
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </a>
              {onDeleteExisting && (
                <button
                  type="button"
                  onClick={() => onDeleteExisting(file._id)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete file"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
