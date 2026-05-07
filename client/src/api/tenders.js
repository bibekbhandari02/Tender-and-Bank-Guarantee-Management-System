import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const tenderAPI = {
  getAll: (params) => api.get('/tenders', { params }),
  getById: (id) => api.get(`/tenders/${id}`),
  create: (data) => api.post('/tenders', data),
  update: (id, data) => api.put(`/tenders/${id}`, data),
  delete: (id) => api.delete(`/tenders/${id}`),
};

export const guaranteeAPI = {
  getByTender: (tenderId) => api.get(`/guarantees/tender/${tenderId}`),
  getById: (id) => api.get(`/guarantees/${id}`),
  create: (data) => api.post('/guarantees', data),
  update: (id, data) => api.put(`/guarantees/${id}`, data),
  delete: (id) => api.delete(`/guarantees/${id}`),
  getExpiring: (days = 30) => api.get('/guarantees/expiring', { params: { days } }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const uploadAPI = {
  // Tender uploads
  uploadBidNotice: (tenderId, formData, onProgress) =>
    api.post(`/upload/tender/${tenderId}/bid-notice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  uploadContractDocs: (tenderId, formData, onProgress) =>
    api.post(`/upload/tender/${tenderId}/contract-docs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  deleteBidNoticeFile: (tenderId, fileId) =>
    api.delete(`/upload/tender/${tenderId}/bid-notice/${fileId}`),
  deleteContractFile: (tenderId, fileId) =>
    api.delete(`/upload/tender/${tenderId}/contract-docs/${fileId}`),

  // Guarantee uploads
  uploadGuaranteeFiles: (guaranteeId, formData, onProgress) =>
    api.post(`/upload/guarantee/${guaranteeId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  deleteGuaranteeFile: (guaranteeId, fileId) =>
    api.delete(`/upload/guarantee/${guaranteeId}/files/${fileId}`),

  // Proxy URL for fetch/axios (goes through CRA dev proxy)
  proxyUrl: (cloudinaryUrl) =>
    `/api/upload/proxy?url=${encodeURIComponent(cloudinaryUrl)}`,

  // Absolute proxy URL for iframe src (bypasses React Router / CRA proxy limitation)
  proxyUrlAbsolute: (cloudinaryUrl) => {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${base}/api/upload/proxy?url=${encodeURIComponent(cloudinaryUrl)}`;
  },
};
