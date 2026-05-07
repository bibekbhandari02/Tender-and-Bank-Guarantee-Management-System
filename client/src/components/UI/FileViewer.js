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

const downloadFile = async (url, fileName) => {
  try {
    const response = await fetch(url);
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
  const [pdfUrl, setPdfUrl] = React.useState(null);

  React.useEffect(() => {
    if (!isPdf(file.file_type)) return;
    // For PDFs stored as Cloudinary raw, fetch a signed URL from our backend
    const base = process.env.REACT_APP_API_URL || '';
    fetch(`${base}/api/upload/signed-url?publicId=${encodeURIComponent(file.public_id)}&resourceType=${file.resource_type || 'raw'}`)
      .then((r) => r.json())
      .then((data) => setPdfUrl(data.url))
      .catch(() => setPdfUrl(file.url)); // fallback to stored URL
  }, [file]);

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
            onClick={() => downloadFile(file.url, file.file_name)}
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
          // PDFs: use signed URL from backend to bypass Cloudinary auth
          pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={file.file_name}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading PDF...
            </div>
          )
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
                onClick={() => downloadFile(file.url, file.file_name)}
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
