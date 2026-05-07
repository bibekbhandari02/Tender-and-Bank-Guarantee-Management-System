import React, { useState } from 'react';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const isPdf = (fileType) => fileType === 'application/pdf' || fileType?.includes('pdf');
const isImage = (fileType) => fileType?.startsWith('image/');

// Route PDFs through our backend proxy (generates signed Cloudinary URL server-side)
const pdfProxyUrl = (publicId) => `/api/upload/pdf-proxy?publicId=${encodeURIComponent(publicId)}`;

const downloadFile = async (url, fileName, publicId, fileType) => {
  try {
    // PDFs: fetch through proxy so we get the actual bytes
    const fetchUrl = isPdf(fileType) && publicId ? pdfProxyUrl(publicId) : url;
    const response = await fetch(fetchUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// ── Preview Modal ────────────────────────────────────────────────
const PreviewModal = ({ file, onClose }) => {
  // For PDFs: use absolute proxy URL so iframe doesn't hit React Router
  const serverBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const viewUrl = isPdf(file.file_type) && file.public_id
    ? `${serverBase}/api/upload/pdf-proxy?publicId=${encodeURIComponent(file.public_id)}`
    : file.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl"
        style={{ height: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <p className="text-white text-sm font-medium truncate pr-4">{file.file_name}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => downloadFile(file.url, file.file_name, file.public_id, file.file_type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download
            </button>
            <button type="button" onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
              <XMarkIcon className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-xl overflow-hidden bg-gray-100">
          {isImage(file.file_type) ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={file.url}
                alt={file.file_name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <iframe
              src={viewUrl}
              title={file.file_name}
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main FileViewer ──────────────────────────────────────────────
const FileViewer = ({ files = [], onDelete, emptyText = 'No files uploaded' }) => {
  const [preview, setPreview] = useState(null);

  if (files.length === 0) {
    return <p className="text-sm text-gray-400 italic py-2">{emptyText}</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file._id}
            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            {/* Icon / Thumbnail */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white border border-gray-200">
              {isImage(file.file_type) ? (
                <img
                  src={file.url}
                  alt={file.file_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <DocumentIcon className="w-5 h-5 text-red-500" />
              )}
            </div>

            {/* File name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.file_name}</p>
              <p className="text-xs text-gray-400">
                {isPdf(file.file_type) ? 'PDF Document' : 'Image'}
              </p>
            </div>

            {/* Actions — visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setPreview(file)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="View"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => downloadFile(file.url, file.file_name, file.public_id, file.file_type)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                title={`Download ${file.file_name}`}
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(file._id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
    </>
  );
};

export default FileViewer;
